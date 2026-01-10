import * as fs from 'fs';
import * as path from 'path';

export interface ExtractedFiles {
  testFile: string | null;
  dataFile: string | null;
}

export function extractFiles(text: string): ExtractedFiles {
  const testMatch = text.match(/```TEST_FILE\n([\s\S]*?)```/);
  const dataMatch = text.match(/```DATA_GENERATOR\n([\s\S]*?)```/);

  return {
    testFile: testMatch ? testMatch[1].trim() : null,
    dataFile: dataMatch ? dataMatch[1].trim() : null,
  };
}

export function saveFiles(
  extracted: ExtractedFiles,
  outputDir: string,
  formName: string
): void {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  if (extracted.testFile) {
    const testPath = path.join(outputDir, `${formName}.spec.ts`);
    fs.writeFileSync(testPath, extracted.testFile);
    console.log(`\nGenerated test file: ${testPath}`);
  }

  if (extracted.dataFile) {
    const dataPath = path.join(outputDir, `${formName}.data.ts`);
    fs.writeFileSync(dataPath, extracted.dataFile);
    console.log(`Generated data file: ${dataPath}`);
  }

  if (!extracted.testFile && !extracted.dataFile) {
    console.warn('\nWarning: No files were extracted from the response.');
    console.warn('The AI may not have generated output in the expected format.');
  }
}
