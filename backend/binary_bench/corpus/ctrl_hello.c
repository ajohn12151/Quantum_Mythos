/* CONTROL: no crypto at all. Pure compute. Must NOT be flagged. */
#include <stdio.h>

static unsigned long collatz_steps(unsigned long n) {
    unsigned long steps = 0;
    while (n != 1) { n = (n & 1) ? 3 * n + 1 : n / 2; steps++; }
    return steps;
}

int main(void) {
    unsigned long total = 0;
    for (unsigned long i = 1; i < 100000; i++) total += collatz_steps(i);
    printf("collatz total: %lu\n", total);
    return 0;
}
