import re

def extrair_dados_do_cte(texto, tabelas, palavras_por_pagina):
    palavras = palavras_por_pagina[0]
    dados = {}

    def buscar_n_ocorrencia(alvo, n=1, regex=None, margem=10):
        count = 0
        for i, p in enumerate(palavras):
            if alvo.lower() in p["text"].lower():
                count += 1
                if count == n:
                    base_y = p["top"]
                    base_x = p["x1"]
                    for prox in palavras[i+1:]:
                        if abs(prox["top"] - base_y) < margem and prox["x0"] > base_x:
                            if regex:
                                match = re.search(regex, prox["text"])
                                if match:
                                    return match.group()
                            else:
                                return prox["text"]
        return None
    






    def extrair_nomes_empresas():
        remetente = []
        destinatario = []

        # --- REMETENTE ---
        for i, p in enumerate(palavras):
            if p["text"].strip().upper() == "REMETENTE":
                y = p["top"]
                for j in range(i + 1, len(palavras)):
                    pj = palavras[j]
                    if abs(pj["top"] - y) < 2:
                        if pj["text"].strip().upper() == "DESTINATÁRIO":
                            break
                        remetente.append(pj["text"])
                break

        # --- DESTINATÁRIO ---
        # Procurar a ÚLTIMA ocorrência da palavra DESTINATÁRIO
        destino_palavra = None
        for p in palavras:
            if p["text"].strip().upper() == "DESTINATÁRIO":
                destino_palavra = p  # sobrescreve até ficar com a última ocorrência

        if destino_palavra:
            y_dest = destino_palavra["top"]
            x_dest = destino_palavra["x1"]
            destinatario = [
                w["text"] for w in sorted(palavras, key=lambda w: w["x0"])
                if abs(w["top"] - y_dest) < 2 and w["x0"] > x_dest
            ]

        return {
            "remetente_nome": " ".join(remetente).strip(),
            "destinatario_nome": " ".join(destinatario).strip()
        }










    def extrair_cidades_origem_destino():
        base_top = None

        # Procurar a ÚLTIMA sequência INICIO DA PRESTAÇÃO
        for i in range(len(palavras) - 2):
            p1 = palavras[i]
            p2 = palavras[i + 1]
            p3 = palavras[i + 2]

            if (
                p1["text"].strip().upper() == "INICIO"
                and p2["text"].strip().upper() == "DA"
                and p3["text"].strip().upper() == "PRESTAÇÃO"
                and abs(p1["top"] - p2["top"]) < 2
                and abs(p1["top"] - p3["top"]) < 2
            ):
                base_top = p1["top"]  # sobrescreve até pegar a última ocorrência

        if base_top is None:
            print("❌ Não foi possível encontrar a sequência INICIO DA PRESTAÇÃO.")
            return None, None

        print(f"\n✅ Último 'INICIO DA PRESTAÇÃO' encontrado em top: {base_top:.2f}")

        # Procurar próxima linha abaixo
        candidatos = [p["top"] for p in palavras if p["top"] > base_top]
        if not candidatos:
            print("❌ Nenhuma linha abaixo encontrada.")
            return None, None

        proxima_linha_top = min(candidatos)

        palavras_linha = [
            p for p in palavras if abs(p["top"] - proxima_linha_top) < 2
        ]

        print("\n--- Linha abaixo de INICIO DA PRESTAÇÃO ---")
        for p in sorted(palavras_linha, key=lambda p: p["x0"]):
            print(f"{p['text']:30} | top: {p['top']:.2f} | x0: {p['x0']:.2f}")

        linha_texto = " ".join(p["text"] for p in sorted(palavras_linha, key=lambda p: p["x0"]))
        cidades = re.findall(r"[A-Z\s]+-\s?[A-Z]{2}", linha_texto)

        if len(cidades) >= 2:
            return cidades[0].strip(), cidades[1].strip()
        else:
            print("❌ Não foi possível extrair as cidades da linha.")
            return None, None


    print("\n--- Palavras que contêm 'PRESTAÇÃO' ---")
    for p in palavras:
        if "PRESTAÇÃO" in p["text"].upper():
            print(f"{p['text']:30} | top: {p['top']:.2f} | x0: {p['x0']:.2f}")


    # ✅ nome
    nomes = extrair_nomes_empresas()
    dados["remetente_nome"] = nomes["remetente_nome"]
    dados["destinatario_nome"] = nomes["destinatario_nome"]


    # ✅ CNPJ
    dados["remetente_cnpj"] = buscar_n_ocorrencia("CNPJ/CPF", n=1, regex=r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}")
    dados["destinatario_cnpj"] = buscar_n_ocorrencia("CNPJ/CPF", n=2, regex=r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}")

    # ✅ Valor total da carga
    match = re.search(r"VALOR TOTAL DA CARGA[\s\S]{0,50}?([\d]{1,3}(?:\.\d{3})*,\d{2})", texto)
    dados["valor_total_carga"] = match.group(1) if match else None

    # ✅ Placas flexível: 1, 2 ou 3 (com / ou -)
    match_placas = re.search(r"VEICULO\s*:\s*([A-Z0-9\-\/]+)", texto)
    if match_placas:
        placas_raw = match_placas.group(1)
        placas = re.findall(r"[A-Z]{3}[0-9][A-Z0-9][0-9]{2}", placas_raw)
        if len(placas) >= 1:
            dados["placa_cavalo"] = placas[0]
        if len(placas) >= 2:
            dados["placa_carreta_1"] = placas[1]
        if len(placas) >= 3:
            dados["placa_carreta_2"] = placas[2]



    # ✅ Local origem e destino (linha abaixo de "INICIO DA PRESTAÇÃO")
    origem, destino = extrair_cidades_origem_destino()
    if origem:
        dados["local_origem"] = origem
    if destino:
        dados["local_destino"] = destino



    return dados
