/* POSITIVE: Windows CNG RSA keypair generation. Quantum-vulnerable (Shor).
   Family is carried by the L"RSA" algorithm-id string (BCRYPT_RSA_ALGORITHM). */
#include <windows.h>
#include <bcrypt.h>
#include <stdio.h>

int main(void) {
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE key = NULL;
    if (BCryptOpenAlgorithmProvider(&alg, L"RSA", NULL, 0) != 0) return 1;
    if (BCryptGenerateKeyPair(alg, &key, 2048, 0) != 0) return 1;
    BCryptFinalizeKeyPair(key, 0);
    printf("cng rsa keypair %p\n", (void *)key);
    BCryptDestroyKey(key);
    BCryptCloseAlgorithmProvider(alg, 0);
    return 0;
}
