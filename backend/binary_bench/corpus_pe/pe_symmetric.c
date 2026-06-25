/* CONTROL (precision trap): Windows CNG, but only SYMMETRIC (AES). Uses
   BCryptGenerateSymmetricKey (not an asymmetric-operation import) and the L"AES"
   provider (not an asymmetric algorithm-id). Must NOT be flagged asymmetric. */
#include <windows.h>
#include <bcrypt.h>
#include <stdio.h>

int main(void) {
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE key = NULL;
    UCHAR keybytes[16] = {0};
    if (BCryptOpenAlgorithmProvider(&alg, L"AES", NULL, 0) != 0) return 1;
    if (BCryptGenerateSymmetricKey(alg, &key, NULL, 0, keybytes, sizeof keybytes, 0) != 0)
        return 1;
    printf("cng aes key %p\n", (void *)key);
    BCryptDestroyKey(key);
    BCryptCloseAlgorithmProvider(alg, 0);
    return 0;
}
