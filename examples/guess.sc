// guess.sc — a number guessing game in Simple C
int secret = random(1, 20)
int tries = 0
int guess = 0
print "I'm thinking of a number from 1 to 20..."
while guess != secret {
    printf("Your guess: ");
    scanf("%d", &guess);
    tries++
    if guess < secret {
        print "Too low!"
    } else if guess > secret {
        print "Too high!"
    }
}
printf("You got it in %d tries!\n", tries);
