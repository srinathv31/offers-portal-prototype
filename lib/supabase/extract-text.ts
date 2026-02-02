import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractHtmlFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "text/plain":
    case "text/markdown": {
      return buffer.toString("utf-8");
    }

    case "application/pdf": {
      const result = await pdf(buffer);
      return result.text;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
  }
}
