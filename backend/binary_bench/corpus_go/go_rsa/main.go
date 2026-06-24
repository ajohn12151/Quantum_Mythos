// POSITIVE: Go RSA keygen. Quantum-vulnerable (Shor). No OpenSSL.
package main

import (
	"crypto/rand"
	"crypto/rsa"
	"fmt"
)

func main() {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}
	fmt.Println("rsa bits:", key.N.BitLen())
}
