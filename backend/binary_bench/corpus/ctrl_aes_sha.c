/* CONTROL (the hard negative): links libcrypto and DOES real crypto, but only
   SYMMETRIC (AES) + HASH (SHA-256). NOT quantum-broken by Shor (Grover-weakened
   only). A correct scanner must NOT classify this as shor_broken just because it
   links OpenSSL. This is the precision test that separates "links libcrypto" from
   "uses asymmetric crypto". */
#include <stdio.h>
#include <string.h>
#include <openssl/evp.h>
#include <openssl/aes.h>
#include <openssl/sha.h>

int main(void) {
    unsigned char key[32] = {0}, iv[16] = {0}, in[16] = "plaintext_block", out[32];
    int outlen = 0;
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key, iv);
    EVP_EncryptUpdate(ctx, out, &outlen, in, sizeof in);
    EVP_CIPHER_CTX_free(ctx);

    unsigned char digest[SHA256_DIGEST_LENGTH];
    SHA256(out, outlen, digest);
    printf("aes+sha done: %d %02x\n", outlen, digest[0]);
    return 0;
}
