/**
 * Improved GIF encoder with median cut color quantization
 * for better color fidelity in animated GIFs
 */

interface ColorBox {
  colors: number[][];
  min: number[];
  max: number[];
}

export class GifEncoder {
  private width: number;
  private height: number;
  private frames: ImageData[] = [];
  private delay: number;
  private globalPalette: number[] | null = null;

  constructor(width: number, height: number, delay: number = 10) {
    this.width = width;
    this.height = height;
    this.delay = delay;
  }

  addFrame(imageData: ImageData) {
    this.frames.push(imageData);
  }

  // Median cut algorithm for better color quantization
  private medianCut(pixels: number[][], numColors: number): number[][] {
    if (pixels.length === 0) return [[0, 0, 0]];
    if (pixels.length <= numColors) return pixels;

    const boxes: ColorBox[] = [{
      colors: pixels,
      min: [255, 255, 255],
      max: [0, 0, 0]
    }];

    // Calculate initial box bounds
    for (const pixel of pixels) {
      for (let i = 0; i < 3; i++) {
        boxes[0].min[i] = Math.min(boxes[0].min[i], pixel[i]);
        boxes[0].max[i] = Math.max(boxes[0].max[i], pixel[i]);
      }
    }

    // Split boxes until we have enough colors
    while (boxes.length < numColors) {
      // Find the box with the largest range to split
      let maxRange = -1;
      let maxRangeIdx = 0;
      let splitChannel = 0;

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (box.colors.length < 2) continue;

        for (let c = 0; c < 3; c++) {
          const range = box.max[c] - box.min[c];
          if (range > maxRange) {
            maxRange = range;
            maxRangeIdx = i;
            splitChannel = c;
          }
        }
      }

      if (maxRange <= 0) break;

      const boxToSplit = boxes[maxRangeIdx];
      
      // Sort by the channel with the largest range
      boxToSplit.colors.sort((a, b) => a[splitChannel] - b[splitChannel]);

      const medianIdx = Math.floor(boxToSplit.colors.length / 2);
      const colors1 = boxToSplit.colors.slice(0, medianIdx);
      const colors2 = boxToSplit.colors.slice(medianIdx);

      if (colors1.length === 0 || colors2.length === 0) break;

      // Create two new boxes
      const box1: ColorBox = { colors: colors1, min: [255, 255, 255], max: [0, 0, 0] };
      const box2: ColorBox = { colors: colors2, min: [255, 255, 255], max: [0, 0, 0] };

      for (const pixel of colors1) {
        for (let i = 0; i < 3; i++) {
          box1.min[i] = Math.min(box1.min[i], pixel[i]);
          box1.max[i] = Math.max(box1.max[i], pixel[i]);
        }
      }

      for (const pixel of colors2) {
        for (let i = 0; i < 3; i++) {
          box2.min[i] = Math.min(box2.min[i], pixel[i]);
          box2.max[i] = Math.max(box2.max[i], pixel[i]);
        }
      }

      boxes.splice(maxRangeIdx, 1, box1, box2);
    }

    // Calculate average color for each box
    return boxes.map(box => {
      const avg = [0, 0, 0];
      for (const pixel of box.colors) {
        avg[0] += pixel[0];
        avg[1] += pixel[1];
        avg[2] += pixel[2];
      }
      return [
        Math.round(avg[0] / box.colors.length),
        Math.round(avg[1] / box.colors.length),
        Math.round(avg[2] / box.colors.length)
      ];
    });
  }

  // Build a global palette from all frames for consistency
  private buildGlobalPalette(): number[] {
    const colorSamples: number[][] = [];
    const sampleRate = Math.max(1, Math.floor(this.frames.length * this.width * this.height / 50000));

    // Sample colors from all frames
    for (const frame of this.frames) {
      const pixels = frame.data;
      for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
        colorSamples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
      }
    }

    // Use median cut to get 256 representative colors
    const palette = this.medianCut(colorSamples, 256);

    // Flatten to array
    const flatPalette: number[] = [];
    for (const color of palette) {
      flatPalette.push(color[0], color[1], color[2]);
    }

    // Pad to 256 colors
    while (flatPalette.length < 256 * 3) {
      flatPalette.push(0, 0, 0);
    }

    return flatPalette;
  }

  // Find closest color in palette using perceptual weighting
  private findClosestColor(r: number, g: number, b: number, palette: number[]): number {
    let minDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < palette.length; i += 3) {
      const pr = palette[i];
      const pg = palette[i + 1];
      const pb = palette[i + 2];

      // Perceptual color distance (weighted for human vision)
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      
      // Human eye is more sensitive to green, then red, then blue
      const dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);

      if (dist < minDist) {
        minDist = dist;
        bestIdx = i / 3;
      }

      // Early exit for exact match
      if (dist === 0) break;
    }

    return bestIdx;
  }

  // Quantize with Floyd-Steinberg dithering for smoother gradients
  private quantizeWithDithering(imageData: ImageData, palette: number[]): Uint8Array {
    const width = this.width;
    const height = this.height;
    const pixels = new Float32Array(imageData.data);
    const indices = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get current pixel (clamped)
        const r = Math.max(0, Math.min(255, Math.round(pixels[idx])));
        const g = Math.max(0, Math.min(255, Math.round(pixels[idx + 1])));
        const b = Math.max(0, Math.min(255, Math.round(pixels[idx + 2])));

        // Find closest palette color
        const colorIdx = this.findClosestColor(r, g, b, palette);
        indices[y * width + x] = colorIdx;

        // Get the palette color
        const pr = palette[colorIdx * 3];
        const pg = palette[colorIdx * 3 + 1];
        const pb = palette[colorIdx * 3 + 2];

        // Calculate quantization error
        const errR = r - pr;
        const errG = g - pg;
        const errB = b - pb;

        // Distribute error to neighboring pixels (Floyd-Steinberg)
        // Right pixel: 7/16
        if (x + 1 < width) {
          const nIdx = idx + 4;
          pixels[nIdx] += errR * 7 / 16;
          pixels[nIdx + 1] += errG * 7 / 16;
          pixels[nIdx + 2] += errB * 7 / 16;
        }

        // Bottom-left pixel: 3/16
        if (y + 1 < height && x > 0) {
          const nIdx = ((y + 1) * width + (x - 1)) * 4;
          pixels[nIdx] += errR * 3 / 16;
          pixels[nIdx + 1] += errG * 3 / 16;
          pixels[nIdx + 2] += errB * 3 / 16;
        }

        // Bottom pixel: 5/16
        if (y + 1 < height) {
          const nIdx = ((y + 1) * width + x) * 4;
          pixels[nIdx] += errR * 5 / 16;
          pixels[nIdx + 1] += errG * 5 / 16;
          pixels[nIdx + 2] += errB * 5 / 16;
        }

        // Bottom-right pixel: 1/16
        if (y + 1 < height && x + 1 < width) {
          const nIdx = ((y + 1) * width + (x + 1)) * 4;
          pixels[nIdx] += errR * 1 / 16;
          pixels[nIdx + 1] += errG * 1 / 16;
          pixels[nIdx + 2] += errB * 1 / 16;
        }
      }
    }

    return indices;
  }

  // LZW compression
  private lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    const output: number[] = [minCodeSize];
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const codeTable = new Map<string, number>();

    // Initialize code table
    for (let i = 0; i < clearCode; i++) {
      codeTable.set(String(i), i);
    }

    let buffer = 0;
    let bufferBits = 0;
    const subBlock: number[] = [];

    const writeCode = (code: number) => {
      buffer |= code << bufferBits;
      bufferBits += codeSize;

      while (bufferBits >= 8) {
        subBlock.push(buffer & 0xff);
        buffer >>= 8;
        bufferBits -= 8;

        if (subBlock.length === 255) {
          output.push(255);
          output.push(...subBlock);
          subBlock.length = 0;
        }
      }
    };

    writeCode(clearCode);

    let indexBuffer = String(indices[0]);

    for (let i = 1; i < indices.length; i++) {
      const k = String(indices[i]);
      const combined = indexBuffer + ',' + k;

      if (codeTable.has(combined)) {
        indexBuffer = combined;
      } else {
        writeCode(codeTable.get(indexBuffer)!);

        if (nextCode < 4096) {
          codeTable.set(combined, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeCode(clearCode);
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
          codeTable.clear();
          for (let j = 0; j < clearCode; j++) {
            codeTable.set(String(j), j);
          }
        }

        indexBuffer = k;
      }
    }

    writeCode(codeTable.get(indexBuffer)!);
    writeCode(eoiCode);

    if (bufferBits > 0) {
      subBlock.push(buffer & 0xff);
    }

    if (subBlock.length > 0) {
      output.push(subBlock.length);
      output.push(...subBlock);
    }

    output.push(0);

    return new Uint8Array(output);
  }

  encode(): Blob {
    if (this.frames.length === 0) {
      throw new Error('No frames to encode');
    }

    // Build global palette from all frames
    this.globalPalette = this.buildGlobalPalette();

    const chunks: Uint8Array[] = [];

    // GIF Header
    chunks.push(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])); // GIF89a

    // Logical Screen Descriptor with global color table
    const lsd = new Uint8Array(7);
    lsd[0] = this.width & 0xff;
    lsd[1] = (this.width >> 8) & 0xff;
    lsd[2] = this.height & 0xff;
    lsd[3] = (this.height >> 8) & 0xff;
    lsd[4] = 0xf7; // Global color table flag + 256 colors (2^(7+1))
    lsd[5] = 0x00; // Background color index
    lsd[6] = 0x00; // Pixel aspect ratio
    chunks.push(lsd);

    // Global Color Table
    chunks.push(new Uint8Array(this.globalPalette));

    // Netscape extension for looping
    chunks.push(new Uint8Array([
      0x21, 0xff, 0x0b,
      0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
      0x32, 0x2e, 0x30,
      0x03, 0x01,
      0x00, 0x00,
      0x00
    ]));

    // Encode each frame
    for (const frame of this.frames) {
      // Quantize frame using global palette with dithering
      const indices = this.quantizeWithDithering(frame, this.globalPalette);

      // Graphic Control Extension
      const gce = new Uint8Array(8);
      gce[0] = 0x21;
      gce[1] = 0xf9;
      gce[2] = 0x04;
      gce[3] = 0x04; // Disposal method: restore to background
      gce[4] = this.delay & 0xff;
      gce[5] = (this.delay >> 8) & 0xff;
      gce[6] = 0x00;
      gce[7] = 0x00;
      chunks.push(gce);

      // Image Descriptor (no local color table)
      const id = new Uint8Array(10);
      id[0] = 0x2c;
      id[1] = 0x00;
      id[2] = 0x00;
      id[3] = 0x00;
      id[4] = 0x00;
      id[5] = this.width & 0xff;
      id[6] = (this.width >> 8) & 0xff;
      id[7] = this.height & 0xff;
      id[8] = (this.height >> 8) & 0xff;
      id[9] = 0x00; // No local color table
      chunks.push(id);

      // Image Data
      const imageData = this.lzwEncode(indices, 8);
      chunks.push(imageData);
    }

    // GIF Trailer
    chunks.push(new Uint8Array([0x3b]));

    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([result], { type: 'image/gif' });
  }
}
