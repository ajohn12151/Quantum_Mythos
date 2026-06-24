/* POSITIVE: ECDH shared-secret derivation (P-256). Quantum-vulnerable (Shor). */
#include <stdio.h>
#include <openssl/ec.h>
#include <openssl/ecdh.h>
#include <openssl/obj_mac.h>

int main(void) {
    EC_KEY *a = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1);
    EC_KEY *b = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1);
    if (!a || !b) return 1;
    if (EC_KEY_generate_key(a) != 1 || EC_KEY_generate_key(b) != 1) return 1;
    unsigned char secret[32];
    int len = ECDH_compute_key(secret, sizeof secret,
                               EC_KEY_get0_public_key(b), a, NULL);
    printf("ECDH secret bytes: %d\n", len);
    EC_KEY_free(a);
    EC_KEY_free(b);
    return 0;
}
