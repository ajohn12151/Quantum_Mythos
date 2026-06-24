// CONTROL: Go binary with no crypto at all. Must NOT be flagged.
package main

import "fmt"

func main() {
	sum := 0
	for i := 1; i < 1_000_000; i++ {
		sum += i % 7
	}
	fmt.Println("sum:", sum)
}
