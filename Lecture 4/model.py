"""Навчальна модель витрат на вимірювання, не повного пристрою."""
def compare(p=0.1, low=0.1, high=1.0, seconds=3600, energy_mj=2):
    if not 0 <= p <= 1 or not 0 < low <= high or seconds <= 0 or energy_mj < 0:
        raise ValueError("Перевірте частку, частоти, час і енергію")
    fixed = seconds * high
    adaptive = seconds * ((1-p)*low + p*high)
    return {"fixed_samples": fixed, "adaptive_samples": adaptive,
            "fixed_mJ": fixed*energy_mj, "adaptive_mJ": adaptive*energy_mj,
            "slow_wait_s": 1/low, "fast_wait_s": 1/high}

if __name__ == "__main__":
    for share in (0.1, 0.5, 1):
        print(share, compare(p=share))
# Змініть low і share. Висновок та контрприклад сформулюйте самостійно.
