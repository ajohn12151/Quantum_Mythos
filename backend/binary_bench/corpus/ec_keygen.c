/* POSITIVE: EC (P-256) keypair generation via legacy EC_KEY API.
   Quantum-vulnerable (Shor over the curve group). */
#include <stdio.h>
#include <openssl/ec.h>
#include <openssl/obj_mac.h>

int main(void) {
    EC_KEY *key = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1);
    if (!key) return 1;
    if (EC_KEY_generate_key(key) != 1) return 1;
    const EC_POINT *pub = EC_KEY_get0_public_key(key);
    printf("EC P-256 key generated: %p\n", (const void *)pub);
    EC_KEY_free(key);
    return 0;
}
