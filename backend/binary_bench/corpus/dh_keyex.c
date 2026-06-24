/* POSITIVE: classic finite-field Diffie-Hellman. Quantum-vulnerable (Shor/discrete log). */
#include <stdio.h>
#include <openssl/dh.h>
#include <openssl/bn.h>

int main(void) {
    DH *dh = DH_new();
    if (!dh) return 1;
    if (DH_generate_parameters_ex(dh, 512, DH_GENERATOR_2, NULL) != 1) return 1;
    if (DH_generate_key(dh) != 1) return 1;
    const BIGNUM *pub = NULL;
    DH_get0_key(dh, &pub, NULL);
    printf("DH public key generated: %p\n", (const void *)pub);
    DH_free(dh);
    return 0;
}
