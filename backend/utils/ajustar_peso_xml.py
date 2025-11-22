import xml.etree.ElementTree as ET

NFE_NAMESPACE = "http://www.portalfiscal.inf.br/nfe"
NS = {"ns": NFE_NAMESPACE}


def ajustar_peso_xml(xml_str: str) -> str:
    """
    Ajusta pesoL para ser igual a pesoB sempre que pesoB > pesoL.
    Funciona com XML da NF-e 4.00 usando prefixo ns0: ou qualquer outro.
    """
    try:
        root = ET.fromstring(xml_str)

        # pega todos os <vol> em qualquer lugar da NFe
        vols = root.findall(".//ns:vol", NS)

        for vol in vols:
            pesoL_elem = vol.find("ns:pesoL", NS)
            pesoB_elem = vol.find("ns:pesoB", NS)

            # ❗ aqui é o ponto crítico: tem que comparar com None,
            # não usar `if not pesoL_elem`
            if pesoL_elem is None or pesoB_elem is None:
                continue

            try:
                # garante que vírgula também funciona se aparecer
                pesoL = float((pesoL_elem.text or "0").replace(",", "."))
                pesoB = float((pesoB_elem.text or "0").replace(",", "."))

                if pesoB > pesoL:
                    # mantém 3 casas, igual vem no XML
                    pesoL_elem.text = f"{pesoB:.3f}"
            except Exception:
                # se der qualquer erro de conversão, pula esse vol
                continue

        return ET.tostring(root, encoding="utf-8").decode("utf-8")

    except Exception as e:
        print("❌ Erro ao ajustar XML:", e)
        return xml_str  # fallback sem mexer no XML
