import xml.etree.ElementTree as ET

def extrair_dados_do_cte_xml(xml_string: str) -> dict:
    try:
        ns = {"cte": "http://www.portalfiscal.inf.br/cte"}
        root = ET.fromstring(xml_string)

        inf_cte = root.find(".//cte:infCte", ns)
        if inf_cte is None:
            raise ValueError("Nó 'infCte' não encontrado")

        inf_cte_norm = inf_cte.find("cte:infCTeNorm", ns)
        if inf_cte_norm is None:
            raise ValueError("Nó 'infCTeNorm' não encontrado")

        # Origem e destino com estado (UF)
        cidade_origem = inf_cte.findtext("cte:ide/cte:xMunIni", default="", namespaces=ns)
        uf_origem = inf_cte.findtext("cte:ide/cte:UFIni", default="", namespaces=ns)
        local_origem = f"{cidade_origem} - {uf_origem}" if cidade_origem and uf_origem else cidade_origem

        cidade_destino = inf_cte.findtext("cte:ide/cte:xMunFim", default="", namespaces=ns)
        uf_destino = inf_cte.findtext("cte:ide/cte:UFFim", default="", namespaces=ns)
        local_destino = f"{cidade_destino} - {uf_destino}" if cidade_destino and uf_destino else cidade_destino

        # Valor total da carga
        valor_total_carga = inf_cte_norm.findtext("cte:infCarga/cte:vCarga", default="", namespaces=ns)

        # Condutor
        condutor = inf_cte.findtext("cte:compl/cte:ObsCont[@xCampo='motorista']/cte:xTexto", default="", namespaces=ns)
        cpf_condutor = inf_cte.findtext("cte:compl/cte:ObsCont[@xCampo='cpf_motorista']/cte:xTexto", default="", namespaces=ns)

        # Placas (cavalo e até duas carretas)
        placa_cavalo = inf_cte.findtext("cte:compl/cte:ObsCont[@xCampo='placa']/cte:xTexto", default="", namespaces=ns)
        placa_carreta_1 = inf_cte.findtext("cte:compl/cte:ObsCont[@xCampo='placa2']/cte:xTexto", default="", namespaces=ns)
        placa_carreta_2 = inf_cte.findtext("cte:compl/cte:ObsCont[@xCampo='placa3']/cte:xTexto", default="", namespaces=ns)

        # Remetente
        remetente = inf_cte.find("cte:rem", ns)
        if remetente is None:
            raise ValueError("Dados do remetente não encontrados")

        remetente_nome = remetente.findtext("cte:xNome", default="", namespaces=ns)
        remetente_cnpj = remetente.findtext("cte:CNPJ", default="", namespaces=ns)
        remetente_endereco = remetente.findtext("cte:enderReme/cte:xLgr", default="", namespaces=ns)

        # Destinatário
        destinatario = inf_cte.find("cte:dest", ns)
        if destinatario is None:
            raise ValueError("Dados do destinatário não encontrados")

        destinatario_nome = destinatario.findtext("cte:xNome", default="", namespaces=ns)
        destinatario_cnpj = destinatario.findtext("cte:CNPJ", default="", namespaces=ns)
        destinatario_endereco = destinatario.findtext("cte:enderDest/cte:xLgr", default="", namespaces=ns)

        return {
            "valor_total_carga": valor_total_carga,
            "condutor": condutor,
            "cpf_condutor": cpf_condutor,
            "placa_cavalo": placa_cavalo,
            "placa_carreta_1": placa_carreta_1,
            "placa_carreta_2": placa_carreta_2,
            "local_origem": local_origem,
            "local_destino": local_destino,
            "remetente_nome": remetente_nome,
            "remetente_cnpj": remetente_cnpj,
            "remetente_endereco": remetente_endereco,
            "destinatario_nome": destinatario_nome,
            "destinatario_cnpj": destinatario_cnpj,
            "destinatario_endereco": destinatario_endereco
        }

    except ET.ParseError:
        raise ValueError("Erro ao fazer o parsing do XML. Verifique se o arquivo está bem formatado.")
    except Exception as e:
        raise ValueError(f"Erro ao extrair dados do XML: {e}")
