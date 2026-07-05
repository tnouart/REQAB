const fs = require('fs');
const path = 'frontend/src/components/PTW.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find and replace the modal container line
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("borderRadius: 14, padding: 24, width: 640, maxHeight: '90vh', overflowY: 'auto'")) {
    lines[i] = "          <div style={{ background: 'var(--white)', borderRadius: 14, width: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh3)' }}>";
    // Insert header div after this
    lines.splice(i + 1, 0,
      "            <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>",
      "              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau permis de travail</div>",
      "              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Remplir tous les champs obligatoires.</div>",
      "            </div>",
      "            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>"
    );
    break;
  }
}

// Replace the old opening of form area
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("Remplir tous les champs obligatoires.</div>") && lines[i].includes("marginBottom: 18")) {
    lines.splice(i, 1);
    break;
  }
}

for (let i = 0; i < lines.length; i++) {
  if (lines[i] === "            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>" && i > 0) {
    // This should still be there, but let's check
  }
}

// Find buttons wrapper and change it to modal footer
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("justifyContent: 'flex-end', marginTop: 16 }}>") && lines[i].includes("display: 'flex'")) {
    lines[i] = "          <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>";
    break;
  }
}

// Find the closing divs after buttons
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "</div>" && i + 1 < lines.length && lines[i+1].trim() === "</div>") {
    // Check if previous line was button closing div
    if (lines[i-1].includes("</div>") && lines[i-2].includes("button")) {
      lines[i] = "          </div>";
      break;
    }
  }
}

// Fix indentation on the form grid closing
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === "            </div>" && lines[i+1] === "            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>") {
    // This is the old </div> before the checklist, keep it
  }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Done');
