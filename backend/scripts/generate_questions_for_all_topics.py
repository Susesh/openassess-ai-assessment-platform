"""
Generate AI questions for all topics in the database with defensive features.
This script helps populate the question bank with more questions per topic.

Features:
- Rate limiting and exponential backoff for quota errors
- Resumable logic (checks existing question counts per topic)
- Conservative batching with delays between topics
- Clean stop on quota errors with detailed reporting
- Quality verification output

Usage:
    python -m backend.scripts.generate_questions_for_all_topics --count 10 --difficulty medium --test-mode
"""

import argparse
import sys
import time
import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal
from backend.models.topic import Topic, Subtopic
from backend.ai.question_generator import generate_questions_from_ai
from backend.models.question import Question
from backend.services.gemini_service import GeminiServiceError


def get_existing_question_count(db, topic: Topic, subtopic: Subtopic = None) -> int:
    """Check how many questions already exist for this topic/subtopic."""
    query = db.query(Question).filter(Question.topic_id == topic.id)
    if subtopic:
        query = query.filter(Question.subtopic_id == subtopic.id)
    return query.count()


def generate_for_topic(db, topic: Topic, count: int, difficulty: str, language: str = "en", 
                       exam_module: str = "Standard", max_retries: int = 3, 
                       delay_between_requests: float = 2.0, show_sample: bool = False) -> tuple[int, list]:
    """Generate questions for a specific topic and its subtopics with defensive features."""
    generated_count = 0
    sample_questions = []
    
    # DEBUG: Show actual topic data being used
    print(f"  DEBUG: Topic ID={topic.id}, Name='{topic.name}', Subject='{topic.subject}'")
    
    # Get subtopics
    subtopics = db.query(Subtopic).filter(Subtopic.topic_id == topic.id).all()
    
    if not subtopics:
        # Check existing count for resumability
        existing_count = get_existing_question_count(db, topic)
        if existing_count >= count:
            print(f"  Skipping topic {topic.name} - already has {existing_count} questions (target: {count})")
            return 0, []
        
        # Generate for topic level if no subtopics with retry logic
        for attempt in range(max_retries):
            try:
                print(f"  Attempt {attempt + 1}/{max_retries} for topic: {topic.name}")
                
                # DEBUG: Show payload being sent to AI
                print(f"  DEBUG PAYLOAD: topic='{topic.name}', subject='{topic.subject}', difficulty='{difficulty}', count={count}, exam_module='{exam_module}'")
                
                questions = generate_questions_from_ai(
                    topic=topic.name,
                    subject=topic.subject,
                    difficulty=difficulty,
                    count=count,
                    exam_module=exam_module,
                    language=language
                )
                
                for q in questions:
                    question = Question(
                        topic_id=topic.id,
                        text=q["question"],
                        options=q["options"],
                        correct_option=q["correct_answer"],
                        explanation=q.get("explanation"),
                        difficulty=difficulty,
                        source="ai_generated",
                        language=language,
                        subject=topic.subject,
                    )
                    db.add(question)
                    generated_count += 1
                    
                    # Collect sample for quality verification
                    if show_sample and len(sample_questions) < 3:
                        sample_questions.append({
                            "topic": topic.name,
                            "subject": topic.subject,
                            "question": q["question"],
                            "options": q["options"],
                            "correct_answer": q["correct_answer"],
                            "explanation": q.get("explanation", "")
                        })
                
                db.commit()
                print(f"  ✓ Generated {generated_count} questions for topic: {topic.name}")
                break
                
            except GeminiServiceError as e:
                if "429" in str(e) or "quota" in str(e).lower() or "rate limit" in str(e).lower():
                    print(f"  ⚠️  Quota/Rate limit error for topic {topic.name}: {e}")
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 5  # Exponential backoff: 5s, 10s, 20s
                        print(f"  ⏳ Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                    else:
                        print(f"  ❌ Max retries reached for topic {topic.name}")
                        raise
                else:
                    print(f"  ❌ Gemini API error for topic {topic.name}: {e}")
                    raise
                    
            except Exception as e:
                print(f"  ❌ Error generating for topic {topic.name}: {e}")
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2
                    print(f"  ⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    db.rollback()
                    raise
    else:
        # Generate for each subtopic with resumability and retry logic
        questions_per_subtopic = max(1, count // len(subtopics))
        for subtopic in subtopics:
            # Check existing count for this subtopic
            existing_count = get_existing_question_count(db, topic, subtopic)
            if existing_count >= questions_per_subtopic:
                print(f"  Skipping subtopic {subtopic.name} - already has {existing_count} questions (target: {questions_per_subtopic})")
                continue
            
            for attempt in range(max_retries):
                try:
                    print(f"  Attempt {attempt + 1}/{max_retries} for subtopic: {subtopic.name}")
                    
                    # DEBUG: Show payload being sent to AI
                    print(f"  DEBUG PAYLOAD: topic='{subtopic.name}', subject='{topic.subject}', subtopic='{subtopic.name}', difficulty='{difficulty}', count={questions_per_subtopic}, exam_module='{exam_module}'")
                    
                    questions = generate_questions_from_ai(
                        topic=subtopic.name,
                        subject=topic.subject,
                        subtopic=subtopic.name,
                        difficulty=difficulty,
                        count=questions_per_subtopic,
                        exam_module=exam_module,
                        language=language
                    )
                    
                    for q in questions:
                        question = Question(
                            topic_id=topic.id,
                            subtopic_id=subtopic.id,
                            text=q["question"],
                            options=q["options"],
                            correct_option=q["correct_answer"],
                            explanation=q.get("explanation"),
                            difficulty=difficulty,
                            source="ai_generated",
                            language=language,
                            subject=topic.subject,
                        )
                        db.add(question)
                        generated_count += 1
                        
                        # Collect sample for quality verification
                        if show_sample and len(sample_questions) < 3:
                            sample_questions.append({
                                "topic": f"{topic.name} - {subtopic.name}",
                                "subject": topic.subject,
                                "question": q["question"],
                                "options": q["options"],
                                "correct_answer": q["correct_answer"],
                                "explanation": q.get("explanation", "")
                            })
                    
                    db.commit()
                    print(f"  ✓ Generated {len(questions)} questions for {topic.name} - {subtopic.name}")
                    break
                    
                except GeminiServiceError as e:
                    if "429" in str(e) or "quota" in str(e).lower() or "rate limit" in str(e).lower():
                        print(f"  ⚠️  Quota/Rate limit error for subtopic {subtopic.name}: {e}")
                        if attempt < max_retries - 1:
                            wait_time = (2 ** attempt) * 5
                            print(f"  ⏳ Waiting {wait_time}s before retry...")
                            time.sleep(wait_time)
                        else:
                            print(f"  ❌ Max retries reached for subtopic {subtopic.name}")
                            raise
                    else:
                        print(f"  ❌ Gemini API error for subtopic {subtopic.name}: {e}")
                        raise
                        
                except Exception as e:
                    print(f"  ❌ Error generating for subtopic {subtopic.name}: {e}")
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 2
                        print(f"  ⏳ Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                    else:
                        db.rollback()
                        raise
            
            # Conservative delay between subtopics
            if delay_between_requests > 0:
                print(f"  ⏳ Delaying {delay_between_requests}s before next subtopic...")
                time.sleep(delay_between_requests)
    
    return generated_count, sample_questions


def main():
    parser = argparse.ArgumentParser(description="Generate AI questions for all topics with defensive features")
    parser.add_argument("--count", type=int, default=5, help="Questions per topic/subtopic")
    parser.add_argument("--difficulty", default="medium", choices=["easy", "medium", "hard"])
    parser.add_argument("--language", default="en", help="Language code (en, hi, kn)")
    parser.add_argument("--subject", help="Generate only for specific subject")
    parser.add_argument("--topic-id", type=int, help="Generate only for specific topic ID")
    parser.add_argument("--exam-module", default="Standard", help="Exam module (Standard, JEE, NEET, CBSE, etc.)")
    parser.add_argument("--test-mode", action="store_true", help="Test mode: process only 2-3 topics and show samples")
    parser.add_argument("--batch-size", type=int, default=3, help="Number of topics to process before pausing")
    parser.add_argument("--delay-between-topics", type=float, default=3.0, help="Delay in seconds between topics")
    parser.add_argument("--max-retries", type=int, default=3, help="Max retries per topic on quota errors")
    parser.add_argument("--show-samples", action="store_true", help="Show sample questions for quality verification")
    parser.add_argument("--priority-topics", nargs="+", help="Priority topic names to process first (e.g., Physics Chemistry Mathematics Biology)")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        # Get topics
        query = db.query(Topic)
        if args.subject:
            query = query.filter(Topic.subject == args.subject)
        if args.topic_id:
            query = query.filter(Topic.id == args.topic_id)
        
        all_topics = query.all()
        
        # If priority topics specified, reorder to process them first
        if args.priority_topics:
            priority_set = set(args.priority_topics)
            priority_topics = [t for t in all_topics if t.name in priority_set]
            remaining_topics = [t for t in all_topics if t.name not in priority_set]
            topics = priority_topics + remaining_topics
            print(f"📋 Priority topics: {len(priority_topics)} ({args.priority_topics})")
            print(f"📋 Remaining topics: {len(remaining_topics)}")
        else:
            topics = all_topics
        
        if not topics:
            print("No topics found matching criteria")
            return
        
        # Test mode: limit to 2-3 topics
        if args.test_mode:
            topics = topics[:min(3, len(topics))]
            print(f"🧪 TEST MODE: Processing {len(topics)} topics only")
        
        print(f"\n{'='*70}")
        print(f"🎓 AI Question Generation for Indian Competitive/Board Exams")
        print(f"{'='*70}")
        print(f"📋 Topics to process: {len(topics)}")
        print(f"📝 Questions per topic: {args.count}")
        print(f"🎯 Difficulty: {args.difficulty}")
        print(f"🌐 Language: {args.language}")
        print(f"📚 Exam Module: {args.exam_module}")
        print(f"⏱️  Delay between topics: {args.delay_between_topics}s")
        print(f"🔄 Max retries: {args.max_retries}")
        print(f"{'='*70}\n")
        
        total_generated = 0
        completed_topics = 0
        failed_topics = 0
        all_sample_questions = []
        
        for i, topic in enumerate(topics):
            topic_num = i + 1
            print(f"\n[{topic_num}/{len(topics)}] Processing topic: {topic.name} (Subject: {topic.subject})")
            print("-" * 70)
            
            try:
                generated, samples = generate_for_topic(
                    db, topic, args.count, args.difficulty, args.language,
                    args.exam_module, args.max_retries, args.delay_between_topics, args.show_samples
                )
                total_generated += generated
                completed_topics += 1
                all_sample_questions.extend(samples)
                
                # Conservative batching: pause after batch_size topics
                if (topic_num % args.batch_size == 0) and topic_num < len(topics):
                    print(f"\n⏸️  Pausing after {args.batch_size} topics (batch {topic_num // args.batch_size})")
                    print(f"   Progress: {completed_topics}/{len(topics)} topics, {total_generated} questions generated")
                    print(f"   Next batch starts in 5 seconds...")
                    time.sleep(5)
                
            except GeminiServiceError as e:
                if "429" in str(e) or "quota" in str(e).lower() or "rate limit" in str(e).lower():
                    print(f"\n{'='*70}")
                    print(f"❌ QUOTA/RATE LIMIT REACHED")
                    print(f"{'='*70}")
                    print(f"⚠️  Gemini API quota exceeded. Generation stopped at topic {topic_num}/{len(topics)}")
                    print(f"✅ Completed topics: {completed_topics}/{len(topics)}")
                    print(f"📝 Total questions generated: {total_generated}")
                    print(f"⏳ Please wait until quota resets before continuing")
                    print(f"💡 You can resume by running the script again - it will skip completed topics")
                    print(f"{'='*70}")
                    failed_topics += len(topics) - completed_topics
                    break
                else:
                    print(f"❌ Gemini API error for topic {topic.name}: {e}")
                    failed_topics += 1
                    continue
                    
            except Exception as e:
                print(f"❌ Unexpected error for topic {topic.name}: {e}")
                failed_topics += 1
                continue
        
        # Final summary
        print(f"\n{'='*70}")
        print(f"📊 GENERATION SUMMARY")
        print(f"{'='*70}")
        print(f"📋 Total topics processed: {len(topics)}")
        print(f"✅ Successfully completed: {completed_topics}")
        print(f"❌ Failed: {failed_topics}")
        print(f"📝 Total questions generated: {total_generated}")
        print(f"{'='*70}")
        
        # Show sample questions for quality verification
        if args.show_samples and all_sample_questions:
            print(f"\n📋 SAMPLE QUESTIONS FOR QUALITY VERIFICATION")
            print(f"{'='*70}")
            for i, sample in enumerate(all_sample_questions[:5], 1):
                print(f"\nSample {i}:")
                print(f"  Topic: {sample['topic']}")
                print(f"  Subject: {sample['subject']}")
                print(f"  Question: {sample['question']}")
                print(f"  Options: {sample['options']}")
                print(f"  Correct Answer: {sample['correct_answer']}")
                print(f"  Explanation: {sample['explanation']}")
            print(f"{'='*70}")
        
        # Save sample questions to file for review
        if args.show_samples and all_sample_questions:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            sample_file = f"sample_questions_{timestamp}.json"
            with open(sample_file, 'w', encoding='utf-8') as f:
                json.dump(all_sample_questions, f, indent=2, ensure_ascii=False)
            print(f"📁 Sample questions saved to: {sample_file}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
