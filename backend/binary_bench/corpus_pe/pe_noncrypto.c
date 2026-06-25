/* CONTROL: Windows PE with no crypto at all. Must NOT be flagged. */
#include <stdio.h>

int main(void) {
    long sum = 0;
    for (int i = 0; i < 100000; i++) sum += (i % 13);
    printf("sum %ld\n", sum);
    return 0;
}
