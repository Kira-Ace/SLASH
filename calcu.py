import math

def calculator():
    print("--- Advanced Math Calculator ---")
    print("Select operation:")
    print("1. Add (+)")
    print("2. Subtract (-)")
    print("3. Multiply (*)")
    print("4. Divide (/)")
    print("5. Square Root (√x)")
    print("6. Power (x^y)")
    print("7. Sine (sin(x) in radians)")
    print("8. Logarithm (Base 10)")
    print("9. Exit")

    while True:
        choice = input("\nEnter choice (1-9): ")

        if choice == '9':
            print("Exiting calculator. Goodbye!")
            break

        if choice in ('1', '2', '3', '4', '6'):
            try:
                num1 = float(input("Enter first number: "))
                num2 = float(input("Enter second number: "))
            except ValueError:
                print("Invalid input. Please enter a number.")
                continue

            if choice == '1':
                print(f"Result: {num1} + {num2} = {num1 + num2}")
            elif choice == '2':
                print(f"Result: {num1} - {num2} = {num1 - num2}")
            elif choice == '3':
                print(f"Result: {num1} * {num2} = {num1 * num2}")
            elif choice == '4':
                if num2 == 0:
                    print("Error: Cannot divide by zero.")
                else:
                    print(f"Result: {num1} / {num2} = {num1 / num2}")
            elif choice == '6':
                print(f"Result: {num1} raised to the power of {num2} = {math.pow(num1, num2)}")

        elif choice in ('5', '7', '8'):
            try:
                num = float(input("Enter the number: "))
            except ValueError:
                print("Invalid input. Please enter a number.")
                continue

            if choice == '5':
                if num < 0:
                    print("Error: Cannot calculate the square root of a negative number.")
                else:
                    print(f"Result: Square root of {num} = {math.sqrt(num)}")
            elif choice == '7':
                print(f"Result: Sine of {num} radians = {math.sin(num)}")
            elif choice == '8':
                if num <= 0:
                    print("Error: Logarithm undefined for zero or negative numbers.")
                else:
                    print(f"Result: Base-10 Logarithm of {num} = {math.log10(num)}")
        else:
            print("Invalid Input. Please select a valid number from the menu.")

if __name__ == "__main__":
    calculator()