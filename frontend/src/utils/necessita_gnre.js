export function necessitaGNRE(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const cstElements = xmlDoc.getElementsByTagName('CST');

    for (let i = 0; i < cstElements.length; i++) {
      const cstValue = cstElements[i].textContent?.trim();
      if (cstValue === '90' || cstValue === '090') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar GNRE:', error);
    return false;
  }
}
