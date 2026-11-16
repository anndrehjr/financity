#!/usr/bin/env python3
"""Cadastra o host público da API do Financity no Nginx Proxy Manager (rodar NA VPS).

  python3 criar-host-api.py [dominio]        # padrão: api.144-217-161-241.sslip.io

- Pede o e-mail e a senha do painel do Nginx Proxy Manager (a senha não aparece na tela e não é gravada).
- Cria (ou reaproveita) o host  dominio -> http://financity-api:8787, pede o certificado Let's Encrypt e força HTTPS.
- Não altera nem remove nenhum outro host do proxy. Pode ser executado de novo sem duplicar nada.
- Só usa a biblioteca padrão do Python.
"""
import getpass
import json
import ssl
import sys
import urllib.error
import urllib.request

NPM = "http://127.0.0.1:81/api"          # o painel só escuta em 127.0.0.1 da VPS
DOMINIO = sys.argv[1] if len(sys.argv) > 1 else "api.144-217-161-241.sslip.io"
DESTINO, PORTA = "financity-api", 8787


def chamar(metodo, caminho, corpo=None, token=None, timeout=60):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(NPM + caminho, data=dados, method=metodo)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode()).get("error", {}).get("message", "")
        except Exception:
            msg = ""
        sys.exit(f"ERRO {e.code} em {metodo} {caminho}: {msg or 'sem detalhes'}")
    except Exception as e:  # rede, tempo esgotado...
        sys.exit(f"ERRO de comunicação com o painel ({type(e).__name__}): {e}")


def main():
    print(f"Domínio da API: {DOMINIO}  ->  http://{DESTINO}:{PORTA}\n")
    email = input("E-mail de login do painel do Nginx Proxy Manager: ").strip()
    senha = getpass.getpass("Senha (não aparece na tela): ")
    tok = chamar("POST", "/tokens", {"identity": email, "secret": senha}).get("token")
    del senha
    if not tok:
        sys.exit("Login recusado: confira o e-mail e a senha do painel.")
    print("Login ok.")

    hosts = chamar("GET", "/nginx/proxy-hosts", token=tok)
    host = next((h for h in hosts if DOMINIO in h.get("domain_names", [])), None)
    base = {
        "domain_names": [DOMINIO], "forward_scheme": "http", "forward_host": DESTINO, "forward_port": PORTA,
        "block_exploits": True, "allow_websocket_upgrade": False, "caching_enabled": False,
        "access_list_id": 0, "advanced_config": "", "locations": [], "enabled": True,
    }
    if host:
        print(f"O host já existe (id {host['id']}); vou só completar o HTTPS.")
        hid = host["id"]
        cert = host.get("certificate_id") or 0
    else:
        novo = chamar("POST", "/nginx/proxy-hosts", {**base, "certificate_id": 0, "ssl_forced": False, "http2_support": False,
                                                    "hsts_enabled": False, "hsts_subdomains": False,
                                                    "meta": {"letsencrypt_agree": False, "dns_challenge": False}}, tok)
        hid, cert = novo["id"], 0
        print(f"Host criado (id {hid}).")

    if not cert:
        email_le = input("E-mail para o certificado Let's Encrypt (avisos de renovação) [Enter = o mesmo do login]: ").strip() or email
        print("Pedindo o certificado (pode levar até 1–2 minutos)...")
        c = chamar("POST", "/nginx/certificates", {"provider": "letsencrypt", "domain_names": [DOMINIO],
                                                   "meta": {"letsencrypt_email": email_le, "letsencrypt_agree": True,
                                                            "dns_challenge": False}}, tok, timeout=240)
        cert = c["id"]
        print(f"Certificado emitido (id {cert}).")

    chamar("PUT", f"/nginx/proxy-hosts/{hid}", {**base, "certificate_id": cert, "ssl_forced": True, "http2_support": True,
                                                "hsts_enabled": True, "hsts_subdomains": False,
                                                "meta": {"letsencrypt_agree": True, "dns_challenge": False}}, tok)
    print("HTTPS forçado e HTTP/2 ativados.\n")

    # conferência final, como a internet veria
    try:
        with urllib.request.urlopen(f"https://{DOMINIO}/healthz", timeout=20, context=ssl.create_default_context()) as r:
            print(f"Teste https://{DOMINIO}/healthz -> HTTP {r.status}: {r.read().decode()[:80]}")
    except Exception as e:
        print(f"Atenção: o host foi cadastrado, mas o teste público falhou ({type(e).__name__}: {e}). Aguarde 1 minuto e abra o endereço no navegador.")


if __name__ == "__main__":
    main()
