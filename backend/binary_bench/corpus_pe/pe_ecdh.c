/* POSITIVE: Windows CNG ECDH (P-256) key. Quantum-vulnerable (Shor).
   Family carried by the L"ECDH_P256" algorithm-id string. */
#include <windows.h>
#include <bcrypt.h>
#include <stdio.h>

int main(void) {
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE key = NULL;
    if (BCryptOpenAlgorithmProvider(&alg, L"ECDH_P256", NULL, 0) != 0) return 1;
    if (BCryptGenerateKeyPair(alg, &key, 256, 0) != 0) return 1;
    BCryptFinalizeKeyPair(key, 0);
    printf("cng ecdh key %p\n", (void *)key);
    BCryptDestroyKey(key);
    BCryptCloseAlgorithmProvider(alg, 0);
    return 0;
}
