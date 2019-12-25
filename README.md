# Advent of Code 2019 solutions

Here are my advent of code 2019 solutions.

Note that I was running all my code in the browser console so I didn't use imports and share code across files,
although some of the code in the files is copied across from other days, each day is self contained.

Whilst that is inefficient for things like the intcode computer you can see how it progressed over time as I haven't gone 
back at any point and updated older solutions.

## Notes

I have tried to make each day run reasonably fast, to the best of my memory the slowest program here should run in a matter
of seconds within the constraints of the challenges.

I tried to do each day in a vaccuum, the exceptions to this rule:

- day 18 part 1

  I implemented someone else's psuedocode and optimised it, then adapted it for part 2.

- day 22 part 2

  I am no mathematician and needed someone to explain modular exponentiation to me, I then implemented
someone elses pseudocode, adapting it as it assumed big integer support and language built ins for modular exponentiation
and modular inverses.