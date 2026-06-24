// CONTROL (precision trap): Go binary that does real crypto, but only SYMMETRIC
// (AES) + HASH (SHA-256). NOT Shor-broken. Go's linker dead-code-eliminates the
// asymmetric packages it never imports, so a correct scanner must NOT flag this —
// the Go analogue of ctrl_aes_sha.c.
package main

import (
	"crypto/aes"
	"crypto/sha256"
	"fmt"
)

func main() {
	block, err := aes.NewCipher(make([]byte, 32))
	if err != nil {
		panic(err)
	}
	h := sha256.Sum256([]byte("plaintext"))
	fmt.Println("aes+sha ok:", block.BlockSize(), h[0])
}
