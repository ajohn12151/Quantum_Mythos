/* POSITIVE: DSA key + sign. Quantum-vulnerable (Shor/discrete log). */
#include <stdio.h>
#include <openssl/dsa.h>
#include <openssl/sha.h>

int main(void) {
    DSA *dsa = DSA_new();
    if (!dsa) return 1;
    if (DSA_generate_parameters_ex(dsa, 1024, NULL, 0, NULL, NULL, NULL) != 1) return 1;
    if (DSA_generate_key(dsa) != 1) return 1;
    unsigned char digest[20];
    SHA1((const unsigned char *)"message", 7, digest);
    DSA_SIG *sig = DSA_do_sign(digest, sizeof digest, dsa);
    if (!sig) return 1;
    printf("DSA signature produced: %p\n", (void *)sig);
    DSA_SIG_free(sig);
    DSA_free(dsa);
    return 0;
}
