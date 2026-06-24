/* POSITIVE: RSA keypair generation via OpenSSL EVP. Quantum-vulnerable (Shor). */
#include <stdio.h>
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>

int main(void) {
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_RSA, NULL);
    if (!ctx) return 1;
    if (EVP_PKEY_keygen_init(ctx) <= 0) return 1;
    if (EVP_PKEY_CTX_set_rsa_keygen_bits(ctx, 2048) <= 0) return 1;
    EVP_PKEY *pkey = NULL;
    if (EVP_PKEY_keygen(ctx, &pkey) <= 0) return 1;
    printf("RSA-2048 key generated: %p\n", (void *)pkey);
    EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);
    return 0;
}
