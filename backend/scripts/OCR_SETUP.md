# OCR Setup Guide for PDF Ingestion

## Overview
The PDF ingestion system includes OCR (Optical Character Recognition) capabilities to handle image-based PDFs that cannot be processed with standard text extraction. This is particularly useful for:
- Karnataka KEA bilingual papers
- Image-based CBSE papers
- Scanned exam papers
- PDFs with embedded images containing text

## Requirements

### 1. Python Dependencies
The following Python packages are already included in `backend/requirements.txt`:
- `pytesseract` - Python wrapper for Tesseract OCR
- `Pillow` - Image processing library (PIL)

### 2. Tesseract OCR Engine (System Dependency)
Tesseract OCR must be installed separately as it's a system-level executable.

## Installation Instructions

### Windows
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install Tesseract (e.g., to `C:\Program Files\Tesseract-OCR`)
3. Add Tesseract to your system PATH:
   - Go to System Properties → Environment Variables
   - Add `C:\Program Files\Tesseract-OCR` to PATH
4. Verify installation:
   ```cmd
   tesseract --version
   ```

### macOS
```bash
brew install tesseract
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install libtesseract-dev
```

## Configuration

### Setting Tesseract Path (Optional)
If Tesseract is not in your PATH, you can specify the path in the script:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Language Support
The system currently uses English OCR (`lang='eng'`). For multilingual support:

```bash
# Download additional language data
# Windows: Download .traineddata files from https://github.com/tesseract-ocr/tessdata
# Place in: C:\Program Files\Tesseract-OCR\tessdata

# Linux/macOS
sudo apt-get install tesseract-ocr-eng  # English
sudo apt-get install tesseract-ocr-hin  # Hindi
sudo apt-get install tesseract-ocr-kan  # Kannada
```

## Usage

The OCR system is automatically integrated into the PDF ingestion pipeline:

```python
# The system will automatically use OCR when:
# 1. Standard text extraction yields <50 characters
# 2. pytesseract and PIL are available
# 3. Tesseract is installed and accessible

# Run batch import
python backend/scripts/batch_import_papers.py
```

## Troubleshooting

### "tesseract is not installed or it's not in your PATH"
**Solution:** Install Tesseract OCR and add it to your system PATH (see installation instructions above).

### "Unsupported image object"
**Solution:** This error occurs when PIL cannot process the image format. The system now uses PIL Image conversion to handle this.

### OCR produces poor results
**Possible solutions:**
1. Increase image resolution in the PDF extraction
2. Use appropriate language models
3. Pre-process images (deskew, denoise)
4. For bilingual papers, specify multiple languages: `lang='eng+kan'`

### OCR is slow
**Solution:** OCR is computationally intensive. Consider:
1. Processing papers in smaller batches
2. Using a machine with better CPU performance
3. Limiting OCR to specific pages only

## Current Status

### Working
- ✅ Python dependencies installed (pytesseract, PIL)
- ✅ OCR integration in PDF extraction pipeline
- ✅ PIL image conversion for compatibility
- ✅ Automatic fallback when text extraction fails

### Requires Manual Setup
- ⚠️ Tesseract OCR engine installation (system dependency)
- ⚠️ Language data for non-English papers

### Failed Papers (12)
- Karnataka KEA papers (4): Require Tesseract installation
- Some UPSC papers: Complex formatting
- Remaining CBSE papers: Image-based content

## Alternative Solutions

If OCR installation is not feasible:

1. **Use Gemini AI**: Once Gemini API is configured, it can handle complex PDF parsing
2. **Manual preprocessing**: Convert image-based PDFs to text-based PDFs using external tools
3. **Format-specific parsers**: Create custom parsers for specific exam board formats

## Testing OCR Installation

Run the test script to verify OCR is working:

```bash
python backend/scripts/test_ocr.py
```

This will attempt to process a sample page and report OCR status.
