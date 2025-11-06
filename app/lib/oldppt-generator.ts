// lib/ppt-generator.ts
import { Slide } from './gemini-client';

export interface GenerationProgress {
  step: 'initializing' | 'creating_slides' | 'finalizing' | 'complete' | 'error';
  message: string;
  percentage: number;
  currentSlide?: number;
  totalSlides?: number;
}

// This function will only work on the client side
export async function generatePresentation(
  slides: Slide[], 
  forPreview: boolean = false,
  format: 'pptx' | 'pdf' = 'pptx',
  onProgress?: (progress: GenerationProgress) => void
): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('PPT generation is only available in the browser');
  }

  try {
    // Dynamic import to avoid SSR issues
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    onProgress?.({
      step: 'initializing',
      message: 'Initializing presentation...',
      percentage: 10
    });

    // Basic presentation setup
    pptx.title = 'AI Generated Presentation';
    pptx.author = 'MagicSlides AI';

    // Create slides
    for (let index = 0; index < slides.length; index++) {
      const slideData = slides[index];
      const slide = pptx.addSlide();
      
      onProgress?.({
        step: 'creating_slides',
        message: `Creating slide ${index + 1} of ${slides.length}...`,
        percentage: 30 + (index / slides.length) * 50,
        currentSlide: index + 1,
        totalSlides: slides.length
      });

      // Simple slide creation without complex shapes
      createSimpleSlide(pptx, slide, slideData, index);
    }

    onProgress?.({
      step: 'finalizing',
      message: 'Finalizing presentation...',
      percentage: 90
    });

    const fileName = `presentation-${Date.now()}.${format}`;
    
    if (forPreview) {
      const result = await pptx.write({ outputType: 'blob' });
      const blob = result as Blob;
      const url = URL.createObjectURL(blob);
      
      onProgress?.({
        step: 'complete',
        message: 'Presentation ready!',
        percentage: 100
      });
      
      return url;
    } else {
      if (format === 'pdf') {
        const result = await pptx.write({ outputType: 'blob' });
        const blob = result as Blob;
        downloadBlob(blob, fileName);
      } else {
        await pptx.writeFile({
          fileName: fileName,
          compression: false // Disable compression for better compatibility
        });
      }

      onProgress?.({
        step: 'complete',
        message: 'Download complete!',
        percentage: 100
      });
      
      return 'download-started';
    }
  } catch (error) {
    console.error('PPT Generation Error:', error);
    onProgress?.({
      step: 'error',
      message: 'Error generating presentation. Please try again.',
      percentage: 0
    });
    throw error;
  }
}

// Helper function to download blob
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Simple slide creation without complex dependencies
function createSimpleSlide(pptx: any, slide: any, slideData: Slide, index: number) {
  // Set slide layout based on type
  switch (slideData.layout) {
    case 'TITLE':
      // Title slide
      slide.addText(slideData.title, {
        x: 0.5,
        y: 2,
        w: 9,
        h: 2,
        fontSize: 44,
        bold: true,
        color: '2C5AA0',
        align: 'center',
        fontFace: 'Arial'
      });

      if (slideData.content.length > 0) {
        slide.addText(slideData.content[0], {
          x: 0.5,
          y: 4,
          w: 9,
          h: 1,
          fontSize: 24,
          color: '666666',
          align: 'center',
          fontFace: 'Arial'
        });
      }
      break;

    case 'SECTION_HEADER':
      // Section header with background color
      slide.background = { color: '2C5AA0' };
      slide.addText(slideData.title, {
        x: 0.5,
        y: 3,
        w: 9,
        h: 1.5,
        fontSize: 36,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        fontFace: 'Arial'
      });

      if (slideData.content.length > 0) {
        slide.addText(slideData.content[0], {
          x: 1,
          y: 4.5,
          w: 8,
          h: 1,
          fontSize: 18,
          color: 'E6E6E6',
          align: 'center',
          fontFace: 'Arial'
        });
      }
      break;

    default:
      // Content slide
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 28,
        bold: true,
        color: '2C5AA0',
        fontFace: 'Arial'
      });

      // Add content as bullet points
      slideData.content.forEach((point, pointIndex) => {
        slide.addText(`• ${point}`, {
          x: 1,
          y: 1.8 + (pointIndex * 0.8),
          w: 8,
          h: 0.6,
          fontSize: 16,
          fontFace: 'Arial',
          bullet: true
        });
      });

      // Add slide number
      slide.addText(`${index + 1}`, {
        x: 8.5,
        y: 6.8,
        w: 1,
        h: 0.4,
        fontSize: 12,
        color: '666666',
        align: 'right',
        fontFace: 'Arial'
      });
      break;
  }
}