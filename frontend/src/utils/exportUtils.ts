/**
 * Utility functions for exporting diagrams to PNG and SVG.
 */

import { getTransformForBounds } from 'reactflow';
import type { Node } from 'reactflow';

const imageWidth = 1920;
const imageHeight = 1080;

/**
 * Download a file with the given content and filename.
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate timestamp-based filename.
 */
function getTimestampFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Export diagram as PNG.
 */
export async function exportToPNG(
  nodes: Node[],
  getNodesBounds: (nodes: Node[]) => { x: number; y: number; width: number; height: number }
): Promise<void> {
  try {
    // Get the viewport element
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      throw new Error('Viewport element not found');
    }

    // Calculate bounds
    const nodesBounds = getNodesBounds(nodes);
    const reactFlowTransform = getTransformForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0.1
    );

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Fill background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, imageWidth, imageHeight);

    // Clone and transform viewport
    const transform = { x: reactFlowTransform[0], y: reactFlowTransform[1], zoom: reactFlowTransform[2] };
    const data = await domToImage(viewport, transform);

    if (data) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            downloadFile(blob, getTimestampFilename('er-diagram', 'png'), 'image/png');
          }
        });
      };
      img.src = data;
    }
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    throw error;
  }
}

/**
 * Export diagram as SVG.
 */
export async function exportToSVG(_nodes: Node[]): Promise<void> {
  try {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      throw new Error('Viewport element not found');
    }

    // Create SVG string from viewport
    const svgString = await domToSVG(viewport);

    if (svgString) {
      downloadFile(svgString, getTimestampFilename('er-diagram', 'svg'), 'image/svg+xml');
    }
  } catch (error) {
    console.error('Error exporting to SVG:', error);
    throw error;
  }
}

/**
 * Simple DOM to image converter (fallback implementation).
 * In production, you might want to use html-to-image library.
 */
async function domToImage(
  element: HTMLElement,
  transform: { x: number; y: number; zoom: number }
): Promise<string | null> {
  try {
    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement;

    // Apply transform
    clone.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`;

    // Serialize to data URL
    const svgString = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Convert DOM to SVG string.
 */
async function domToSVG(element: HTMLElement): Promise<string | null> {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    const bbox = element.getBoundingClientRect();

    // Create SVG wrapper
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    return svg;
  } catch {
    return null;
  }
}

/**
 * Export DDL as text file.
 */
export function exportDDL(ddl: string): void {
  downloadFile(ddl, getTimestampFilename('schema', 'sql'), 'text/plain');
}
