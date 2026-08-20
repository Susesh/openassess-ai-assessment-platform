"""
PDF Question Paper Importer for OpenAssess

This script ingests official Previous Year Question (PYQ) PDFs (JEE Mains, NEET, CBSE, UPSC, etc.)
into the Supabase database. It uses PyMuPDF for text extraction and Gemini AI for intelligent
text-to-JSON extraction of questions.

Usage:
    python backend/scripts/import_pdf_paper.py --pdf path/to/paper.pdf --exam_name "JEE Mains 2023 - Physics Shift 1" --subject "Physics" --subtopic_id 1
"""

import argparse
import sys
import os
import json
import fitz  # PyMuPDF
from typing import List, Dict, Any
import re
import time
try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  OCR not available (pytesseract or PIL not installed)")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models.question import Question
from backend.models.question_paper import QuestionPaper, QuestionPaperQuestion
from backend.services.gemini_service import generate_text, generate_content_with_image


class PDFQuestionExtractor:
    """Extract questions from PDF using PyMuPDF and Gemini AI with Vision fallback."""
    
    def __init__(self, pdf_path: str, use_vision_fallback: bool = False):
        self.pdf_path = pdf_path
        self.pdf_text = ""
        self.use_vision_fallback = use_vision_fallback
        
    def extract_text_from_pdf(self) -> str:
        """Extract raw text from PDF page by page with OCR fallback for image-based PDFs."""
        try:
            doc = fitz.open(self.pdf_path)
            text_chunks = []
            ocr_used = False
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                
                # If text extraction yields very little text, try OCR
                if len(text.strip()) < 50 and OCR_AVAILABLE:
                    try:
                        # Convert page to image for OCR using PIL
                        pix = page.get_pixmap()
                        img_bytes = pix.tobytes("png")
                        
                        # Convert bytes to PIL Image
                        pil_image = Image.open(io.BytesIO(img_bytes))
                        
                        # Use pytesseract for OCR with PIL Image
                        ocr_text = pytesseract.image_to_string(pil_image, lang='eng')
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                            ocr_used = True
                    except Exception as ocr_error:
                        print(f"  ⚠️  OCR failed for page {page_num + 1}: {ocr_error}")
                
                text_chunks.append(f"--- Page {page_num + 1} ---\n{text}")
            
            doc.close()
            self.pdf_text = "\n\n".join(text_chunks)
            
            if ocr_used:
                print(f"✓ Extracted text from {len(text_chunks)} pages (OCR used for some pages)")
            else:
                print(f"✓ Extracted text from {len(text_chunks)} pages")
            
            return self.pdf_text
        except Exception as e:
            print(f"✗ Error extracting text from PDF: {e}")
            raise
    
    def chunk_text(self, text: str, chunk_size: int = 1000) -> List[str]:
        """Split text into manageable chunks for Gemini processing."""
        chunks = []
        current_chunk = ""
        lines = text.split('\n')
        
        for line in lines:
            if len(current_chunk) + len(line) + 1 > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = line
            else:
                current_chunk += '\n' + line if current_chunk else line
        
        if current_chunk:
            chunks.append(current_chunk)
        
        print(f"✓ Split text into {len(chunks)} chunks")
        return chunks
    
    def extract_questions_with_gemini(self, text: str) -> List[Dict[str, Any]]:
        """Use regex-based extraction as primary method since Gemini API is unavailable."""
        print("⚠️  Using regex-based extraction (Gemini API unavailable)")
        return self.extract_questions_with_regex(text)
    
    def extract_questions_with_gemini_vision(self, page_num: int, doc) -> List[Dict[str, Any]]:
        """Extract questions from a PDF page using Gemini Vision with retry logic."""
        max_retries = 2
        base_delay = 3
        
        for attempt in range(max_retries + 1):
            try:
                page = doc[page_num]
                
                # Convert page to PNG image bytes with lower DPI for faster processing
                pix = page.get_pixmap(dpi=100)  # Reduced from 150 to 100 for faster processing
                img_bytes = pix.tobytes("png")
                
                # Exact prompt as specified
                vision_prompt = """You are an expert exam paper digitizer. Look at this image of an official exam paper page. Read all visible text (including native scripts like Kannada or Hindi), parse every multiple-choice question, options (A, B, C, D), and correct answer/explanation if shown. Return strictly a JSON array matching our schema: [{"question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A|B|C|D", "explanation": "..."}]. Do not skip questions due to 2-column or complex layouts."""
                
                print(f"  📸 Processing page {page_num + 1} with Gemini Vision (attempt {attempt + 1}/{max_retries + 1})...")
                response = generate_content_with_image(vision_prompt, img_bytes, mime_type="image/png")
                
                # Parse JSON response
                try:
                    questions = json.loads(response)
                    if isinstance(questions, list):
                        print(f"  ✓ Extracted {len(questions)} questions from page {page_num + 1} using Vision")
                        return questions
                    else:
                        print(f"  ⚠️  Vision response not a list, falling back to regex")
                        return []
                except json.JSONDecodeError:
                    print(f"  ⚠️  Vision response not valid JSON, falling back to regex")
                    return []
                    
            except Exception as e:
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)  # Exponential backoff
                    print(f"  ⚠️  Vision extraction failed for page {page_num + 1}: {e}")
                    print(f"  ⏳ Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    print(f"  ⚠️  Vision extraction failed for page {page_num + 1} after {max_retries + 1} attempts: {e}")
                    return []
        
        return []
    
    def extract_questions_with_regex(self, text: str) -> List[Dict[str, Any]]:
        """Enhanced regex-based question extraction for various exam formats including NTA, UPSC, and regional formats."""
        questions = []
        
        # Multiple patterns for different question formats
        question_patterns = [
            # Pattern for NTA system format: "Question Number : 1 Question Id : ..."
            re.compile(r'Question Number\s*:\s*(\d+)', re.DOTALL),
            # Pattern for UPSC format: "1." followed by question text (multiline)
            re.compile(r'^(\d+)\.\s+(.+?)(?=^\d+\.|$)', re.MULTILINE | re.DOTALL),
            # Pattern for UPSC format with uppercase start: "1." followed by question
            re.compile(r'^(\d+)\.\s+([A-Z][^.]+.*?)(?=^\d+\.|$)', re.MULTILINE | re.DOTALL),
            # Pattern for UPSC with "Directions" and question numbers
            re.compile(r'^(\d+)\.\s+(.*?)(?=^\d+\.|Directions|Instructions|$)', re.MULTILINE | re.DOTALL),
            # Pattern for UPSC CSAT format with (a) options
            re.compile(r'^(\d+)\.\s+.*?\([a-d]\).*?(?=^\d+\.|$)', re.MULTILINE | re.DOTALL),
            # Pattern 1: "1. Question text..."
            re.compile(r'(\d+)\.\s+(.*?)(?=\d+\.\s+|$)', re.DOTALL),
            # Pattern 2: "1) Question text..."
            re.compile(r'(\d+)\)\s+(.*?)(?=\d+\)\s+|$)', re.DOTALL),
            # Pattern 3: "Q1. Question text..."
            re.compile(r'Q(\d+)\.\s+(.*?)(?=Q\d+\.\s+|$)', re.DOTALL),
            # Pattern 4: "Question 1: Question text..."
            re.compile(r'Question\s+(\d+)[\.:]\s+(.*?)(?=Question\s+\d+[\.:]|$)', re.DOTALL),
            # Pattern for Karnataka format: "Q." followed by question
            re.compile(r'Q\.\s*(\d+)\s*(.*?)(?=Q\.|$)', re.DOTALL),
            # Pattern for simple numbered questions without dots
            re.compile(r'^(\d+)\s+([A-Z].*?)(?=^\d+\s|$)', re.MULTILINE | re.DOTALL),
        ]
        
        # Multiple patterns for options
        option_patterns = [
            # Pattern for NTA system format: "40503638481." (numeric IDs)
            re.compile(r'(\d{8,})\.', re.DOTALL),
            # Pattern for UPSC format: "(a)" or "(b)" with lowercase
            re.compile(r'\(([a-d])\)\s+(.*?)(?=\([a-d]\)\s+|$)', re.DOTALL),
            # Pattern for UPSC format: "(a)." with period
            re.compile(r'\(([a-d])\)\.\s+(.*?)(?=\([a-d]\)\.\s+|$)', re.DOTALL),
            # Pattern 1: "(A) Option text"
            re.compile(r'\(([A-D])\)\s+(.*?)(?=\([A-D]\)\s+|$)', re.DOTALL),
            # Pattern 2: "A. Option text"
            re.compile(r'([A-D])\.\s+(.*?)(?=[A-D]\.\s+|$)', re.DOTALL),
            # Pattern 3: "A) Option text"
            re.compile(r'([A-D])\)\s+(.*?)(?=[A-D]\)\s+|$)', re.DOTALL),
            # Pattern for Karnataka format: "a." or "b." with lowercase
            re.compile(r'([a-d])\.\s+(.*?)(?=[a-d]\.\s+|$)', re.DOTALL),
        ]
        
        # Try each question pattern
        for q_pattern in question_patterns:
            matches = list(q_pattern.finditer(text))
            
            if len(matches) > 0:  # Use the first pattern that finds matches
                for match in matches:
                    question_num = match.group(1)
                    
                    # For NTA format, extract context around question number
                    if "Question Number" in text[max(0, match.start()-50):match.start()+50]:
                        # Extract larger context for NTA format
                        start_pos = max(0, match.start() - 200)
                        end_pos = min(len(text), match.end() + 500)
                        question_text = text[start_pos:end_pos].strip()
                    else:
                        question_text = match.group(2).strip() if len(match.groups()) > 1 else ""
                    
                    # Clean up the question text
                    question_text = re.sub(r'\s+', ' ', question_text)  # Normalize whitespace
                    question_text = re.sub(r'\n+', ' ', question_text)  # Remove newlines
                    
                    if len(question_text) < 30:  # Skip very short matches
                        continue
                    
                    # Extract options from the question text
                    options_found = []
                    for opt_pattern in option_patterns:
                        options = opt_pattern.findall(question_text)
                        if len(options) >= 2:  # Found good options
                            # Handle numeric IDs for NTA format
                            if opt_pattern.pattern.startswith(r'(\d{8,})'):
                                options_found = [(chr(65+i), opt[0]) for i, opt in enumerate(options[:4])]
                            else:
                                options_found = [(opt[0].upper(), opt[1].strip()) for opt in options]
                            break
                    
                    if len(options_found) >= 2:  # Need at least 2 options
                        option_dict = {opt[0]: opt[1] for opt in options_found}
                        
                        question = {
                            "question_text": f"Question {question_num}: {question_text[:300]}...",
                            "option_a": option_dict.get('A', ''),
                            "option_b": option_dict.get('B', ''),
                            "option_c": option_dict.get('C', ''),
                            "option_d": option_dict.get('D', ''),
                            "correct_option": '',  # Cannot determine without answer key
                            "explanation": ''
                        }
                        questions.append(question)
                
                if len(questions) > 0:
                    break  # Stop if we found questions with this pattern
        
        print(f"✓ Extracted {len(questions)} questions using regex fallback")
        return questions
    
    def process_pdf(self) -> List[Dict[str, Any]]:
        """Complete PDF processing pipeline with Vision fallback for scanned/low-text pages."""
        print(f"\n📄 Processing PDF: {self.pdf_path}")
        print("=" * 50)
        
        # Extract text and detect if vision fallback is needed
        doc = fitz.open(self.pdf_path)
        text_chunks = []
        low_text_pages = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            text_chunks.append(f"--- Page {page_num + 1} ---\n{text}")
            
            # Detect low-text pages (< 100 characters)
            if len(text.strip()) < 100:
                low_text_pages.append(page_num)
        
        self.pdf_text = "\n\n".join(text_chunks)
        print(f"✓ Extracted text from {len(text_chunks)} pages")
        print(f"📊 Low-text pages detected: {len(low_text_pages)}")
        
        all_questions = []
        
        # Use Vision fallback for low-text pages if enabled
        if self.use_vision_fallback and low_text_pages:
            print(f"🔍 Using Gemini Vision for {len(low_text_pages)} low-text pages...")
            for page_num in low_text_pages:
                vision_questions = self.extract_questions_with_gemini_vision(page_num, doc)
                all_questions.extend(vision_questions)
        
        # Process remaining text with regex
        if not self.use_vision_fallback or len(low_text_pages) < len(doc):
            print("🔍 Processing entire text for question extraction...")
            regex_questions = self.extract_questions_with_gemini(self.pdf_text)
            all_questions.extend(regex_questions)
        
        doc.close()
        
        print(f"\n✓ Total questions extracted: {len(all_questions)}")
        return all_questions


class DatabaseImporter:
    """Import extracted questions into the database."""
    
    def __init__(self, exam_name: str, subject: str, subtopic_id: int = None):
        self.exam_name = exam_name
        self.subject = subject
        self.subtopic_id = subtopic_id
        self.db = SessionLocal()
    
    def create_question_paper(self) -> QuestionPaper:
        """Create a question paper entry."""
        try:
            # Extract year from exam_name if possible
            import re
            year_match = re.search(r'20\d{2}', self.exam_name)
            year = int(year_match.group()) if year_match else 2024
            
            question_paper = QuestionPaper(
                exam_category="General",
                board="Unknown",
                exam_name=self.exam_name,
                year=year,
                subject=self.subject,
                total_questions=0,
                total_marks=300,  # Default marks
                language="en",
                is_published=True
            )
            self.db.add(question_paper)
            self.db.commit()
            self.db.refresh(question_paper)
            print(f"✓ Created question paper: {question_paper.id}")
            return question_paper
        except Exception as e:
            print(f"✗ Error creating question paper: {e}")
            self.db.rollback()
            raise
    
    def import_questions(self, questions: List[Dict[str, Any]], question_paper_id: int) -> int:
        """Import questions into the database using QuestionPaperQuestion relationship."""
        imported_count = 0
        
        for i, q_data in enumerate(questions):
            try:
                # Create Question object
                question = Question(
                    topic_id=self.subtopic_id if self.subtopic_id else 1,  # Default to topic 1 if not specified
                    text=q_data.get('question_text', ''),
                    options=json.dumps({
                        'A': q_data.get('option_a', ''),
                        'B': q_data.get('option_b', ''),
                        'C': q_data.get('option_c', ''),
                        'D': q_data.get('option_d', '')
                    }),
                    correct_option=q_data.get('correct_option', ''),
                    explanation=q_data.get('explanation', ''),
                    difficulty='medium',  # Default difficulty
                    marks=4,  # Default marks
                    subject=self.subject
                )
                self.db.add(question)
                self.db.flush()  # Get the question ID
                
                # Create QuestionPaperQuestion relationship
                paper_question = QuestionPaperQuestion(
                    paper_id=question_paper_id,
                    question_id=question.id,
                    question_number=i + 1,
                    topic_id=self.subtopic_id if self.subtopic_id else 1,
                    question_type='mcq',
                    difficulty='medium',
                    marks=4,
                    question_text_snapshot=q_data.get('question_text', ''),
                    options_snapshot={
                        'A': q_data.get('option_a', ''),
                        'B': q_data.get('option_b', ''),
                        'C': q_data.get('option_c', ''),
                        'D': q_data.get('option_d', '')
                    },
                    correct_option_snapshot=q_data.get('correct_option', '')
                )
                self.db.add(paper_question)
                imported_count += 1
                
                if (i + 1) % 10 == 0:
                    print(f"  Imported {i + 1}/{len(questions)} questions...")
                    
            except Exception as e:
                print(f"✗ Error importing question {i + 1}: {e}")
                self.db.rollback()
                continue
        
        self.db.commit()
        return imported_count
    
    def update_question_paper_count(self, question_paper_id: int, count: int):
        """Update the total questions count in question paper."""
        try:
            question_paper = self.db.query(QuestionPaper).filter(
                QuestionPaper.id == question_paper_id
            ).first()
            if question_paper:
                question_paper.total_questions = count
                self.db.commit()
                print(f"✓ Updated question paper count to {count}")
        except Exception as e:
            print(f"✗ Error updating question paper count: {e}")
    
    def close(self):
        """Close database session."""
        self.db.close()


def main():
    parser = argparse.ArgumentParser(
        description='Import PDF question papers into OpenAssess database'
    )
    parser.add_argument('--pdf', required=True, help='Path to the PDF file')
    parser.add_argument('--exam_name', required=True, help='Title of the exam paper')
    parser.add_argument('--subject', required=True, help='Subject name')
    parser.add_argument('--subtopic_id', type=int, help='Subtopic ID (optional)')
    parser.add_argument('--use_vision', action='store_true', help='Use Gemini Vision for scanned/low-text pages')
    
    args = parser.parse_args()
    
    # Validate PDF file exists
    if not os.path.exists(args.pdf):
        print(f"✗ Error: PDF file not found: {args.pdf}")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎓 PDF Question Paper Importer for OpenAssess")
    print("=" * 60)
    
    try:
        # Extract questions from PDF
        extractor = PDFQuestionExtractor(args.pdf, use_vision_fallback=args.use_vision)
        questions = extractor.process_pdf()
        
        if not questions:
            print("✗ No questions extracted. Aborting import.")
            sys.exit(1)
        
        # Import into database
        print(f"\n💾 Importing to database...")
        print("=" * 50)
        
        importer = DatabaseImporter(
            exam_name=args.exam_name,
            subject=args.subject,
            subtopic_id=args.subtopic_id
        )
        
        # Create question paper
        question_paper = importer.create_question_paper()
        
        # Import questions
        imported_count = importer.import_questions(questions, question_paper.id)
        
        # Update question paper count
        importer.update_question_paper_count(question_paper.id, imported_count)
        
        # Close database connection
        importer.close()
        
        print("\n" + "=" * 60)
        print("✅ Import completed successfully!")
        print(f"   Exam: {args.exam_name}")
        print(f"   Subject: {args.subject}")
        print(f"   Questions imported: {imported_count}")
        print(f"   Question Paper ID: {question_paper.id}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
