// Script para generar el documento Word (.docx)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const markdown = fs.readFileSync(path.join(__dirname, 'ANALISIS_FINANCIERO.md'), 'utf-8');

// Convertir markdown a parrafos de Word
const paragraphs = markdown.split('\n').filter(line => line.trim()).map(line => {
  let style = '';
  let text = line.trim();

  if (text.startsWith('### ')) {
    style = 'Heading3';
    text = text.replace(/^### /, '');
  } else if (text.startsWith('## ')) {
    style = 'Heading2';
    text = text.replace(/^## /, '');
  } else if (text.startsWith('# ')) {
    style = 'Heading1';
    text = text.replace(/^# /, '');
  } else if (text.startsWith('| ')) {
    const cells = text.split('|').map(c => c.trim()).filter(c => c);
    return `<w:p><w:r><w:t xml:space="preserve">${cells.join(' | ')}</w:t></w:r></w:p>`;
  } else if (text.startsWith('---')) {
    return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr></w:pPr></w:p>`;
  } else if (text.startsWith('> ')) {
    text = text.replace(/^> /, '');
    return `<w:p><w:pPr><w:ind w:left="420"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="2E74B5"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  } else if (text.startsWith('- ')) {
    text = text.replace(/^- /, '');
    return `<w:p><w:pPr><w:ind w:left="420"/></w:pPr><w:r><w:t xml:space="preserve">• ${text}</w:t></w:r></w:p>`;
  }

  if (style) {
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  }

  // Negrita entre **texto**
  text = text.replace(/\*\*(.+?)\*\*/g, '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">$1</w:t></w:r>');

  return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}).join('\n');

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

// Crear estructura de carpetas
const docDir = path.join(__dirname, 'docx_build');
if (fs.existsSync(docDir)) fs.rmSync(docDir, { recursive: true });
fs.mkdirSync(path.join(docDir, 'word', '_rels'), { recursive: true });
fs.mkdirSync(path.join(docDir, '_rels'), { recursive: true });

// Escribir archivos
fs.writeFileSync(path.join(docDir, '[Content_Types].xml'), contentTypes);
fs.writeFileSync(path.join(docDir, '_rels', '.rels'), rels);
fs.writeFileSync(path.join(docDir, 'word', 'document.xml'), documentXml);
fs.writeFileSync(path.join(docDir, 'word', '_rels', 'document.xml.rels'), docRels);

// Comprimir a .docx usando PowerShell
const outputFile = path.join(__dirname, 'ANALISIS_FINANCIERO.docx');
try {
  execSync(`powershell -Command "Compress-Archive -Path '${docDir}\\*' -DestinationPath '${outputFile}' -Force"`, { stdio: 'inherit' });
  console.log('Documento generado:', outputFile);
} catch (e) {
  // Alternativa: usar tar (disponible en Windows 10+)
  execSync(`tar -a -c -f "${outputFile}" -C "${docDir}" .`, { stdio: 'inherit' });
  console.log('Documento generado (con tar):', outputFile);
}

// Limpiar carpeta temporal
fs.rmSync(docDir, { recursive: true });
console.log('Listo.');
