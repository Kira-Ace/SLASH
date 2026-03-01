import random
import time

def risk_roulette():
    print("~~~ Russian Roulette ~~~")
    print("Rules:")
    print("- There are 6 rounds. 1 is live.")
    print("- Each time you pull the trigger and survive, you win cash.")
    print("- The prize money doubles with each consecutive pull.")
    print("- You can forfeit at any time to walk away with your current winnings.")
    print("- If you pull the trigger on the live round, you lose everything!\n")
    print("May the odds be ever in your favor.")

    cylinder = [False, False, False, False, False, True]
    random.shuffle(cylinder)
    
    winnings = 0
    current_prize = 10000  
    
    for round_num in range(1, 7):
        print(f"\n--- Round {round_num} ---")
        print(f"Current Bank: ₱{winnings:,}")
        print(f"Potential Prize for this pull: ${current_prize:,}")
        
        if round_num == 6:
            print("!WARNING! There is only 1 chamber left. Do you intend to end your life?")
        
        choice = input("Do you want to [P]ull the trigger or [F]orfeit and take the money? ").strip().upper()
        
        if choice == 'F':
            print(f"\nSmart move. You played it safe and walked away with ${winnings:,}. Congratulations!")
            break
            
        elif choice == 'P':
            print("You pull the trigger...")
            time.sleep(1.5) 
            if cylinder[round_num - 1]:  
                print("BANG! Your head coils backward. Blood spills  \nall over the place. You lose everything.")
                winnings = 0
                break
            else:
                print("Click! You're safe.")
                winnings += current_prize
                current_prize *= 2
        else:
            print("Invalid choice. Please enter 'P' to pull or 'F' to forfeit.")
            continue
        
    print(f"\nGame Over. Your final winnings are... ${winnings:,}.")
    
if __name__ == "__main__":
    risk_roulette()
    
    
    