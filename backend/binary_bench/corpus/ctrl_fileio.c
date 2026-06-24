/* CONTROL: file/string I/O, no crypto. Must NOT be flagged. */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    char buf[256];
    size_t total = 0;
    for (int i = 0; i < argc; i++) {
        strncpy(buf, argv[i], sizeof buf - 1);
        buf[sizeof buf - 1] = '\0';
        total += strlen(buf);
    }
    printf("argv char total: %zu\n", total);
    return 0;
}
