// POSITIVE: Go ECDSA keygen + sign (P-256). Quantum-vulnerable (Shor). No OpenSSL.
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"fmt"
)

func main() {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	digest := []byte("0123456789abcdef0123456789abcdef") // 32-byte stand-in digest
	r, s, err := ecdsa.Sign(rand.Reader, key, digest)
	if err != nil {
		panic(err)
	}
	fmt.Println("ecdsa ok:", r.Sign(), s.Sign())
}
