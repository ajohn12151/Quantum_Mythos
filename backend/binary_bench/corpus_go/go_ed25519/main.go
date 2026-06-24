// POSITIVE: Go Ed25519 keygen + sign (EdDSA). Quantum-vulnerable (Shor). No OpenSSL.
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"fmt"
)

func main() {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		panic(err)
	}
	sig := ed25519.Sign(priv, []byte("message"))
	fmt.Println("ed25519 ok:", len(pub), len(sig))
}
