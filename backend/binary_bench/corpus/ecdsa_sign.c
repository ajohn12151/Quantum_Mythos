/* POSITIVE: ECDSA signature (P-256). Quantum-vulnerable (Shor). */
#include <stdio.h>
#include <string.h>
#include <openssl/ec.h>
#include <openssl/ecdsa.h>
#include <openssl/obj_mac.h>
#include <openssl/sha.h>

int main(void) {
    EC_KEY *key = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1);
    if (!key || EC_KEY_generate_key(key) != 1) return 1;
    unsigned char digest[32];
    SHA256((const unsigned char *)"message", 7, digest);
    ECDSA_SIG *sig = ECDSA_do_sign(digest, sizeof digest, key);
    if (!sig) return 1;
    printf("ECDSA signature produced: %p\n", (void *)sig);
    ECDSA_SIG_free(sig);
    EC_KEY_free(key);
    return 0;
}
