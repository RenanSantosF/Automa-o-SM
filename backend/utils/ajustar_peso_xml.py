import xml.etree.ElementTree as ET

NAMESPACE = "http://www.portalfiscal.inf.br/nfe"
NS = {"ns": NAMESPACE}

def ajustar_peso_xml(xml_str: str) -> str:
    try:
        root = ET.fromstring(xml_str)

        # --- Registrar namespace padrão (remove ns0:) ---
        ET.register_namespace('', NAMESPACE)

        # --- Localizar todos <vol> ---
        vols = root.findall(".//ns:vol", NS)

        for vol in vols:
            pesoL_elem = vol.find("ns:pesoL", NS)
            pesoB_elem = vol.find("ns:pesoB", NS)

            if pesoL_elem is None or pesoB_elem is None:
                continue

            try:
                pesoL = float((pesoL_elem.text or "0").replace(",", "."))
                pesoB = float((pesoB_elem.text or "0").replace(",", "."))

                if pesoB > pesoL:
                    pesoL_elem.text = f"{pesoB:.3f}"
            except:
                pass

        # --- Converter mantendo namespace default (sem ns0) ---
        return ET.tostring(root, encoding="utf-8", xml_declaration=False).decode("utf-8")

    except Exception as e:
        print("❌ Erro ao ajustar XML:", e)
        return xml_str
