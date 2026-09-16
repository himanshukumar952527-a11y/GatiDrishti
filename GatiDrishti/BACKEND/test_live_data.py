from live_data import collect_live_data, get_from_redis


# ---------------------------------------------------------
# Test train number
# ---------------------------------------------------------

train_number = "12951"


# ---------------------------------------------------------
# STEP 1: Live data collect karo
# ---------------------------------------------------------

print("\n========== COLLECTING LIVE DATA ==========\n")

data = collect_live_data(train_number)


if data is None:
    print("❌ Live data collection failed.")
    exit()


print("✅ Live data collected successfully.")


# ---------------------------------------------------------
# STEP 2: Jo Redis me save hua hai, wahi dobara read karo
# ---------------------------------------------------------

print("\n========== DATA FROM REDIS ==========\n")

redis_data = get_from_redis(train_number)


if redis_data is None:
    print("❌ Data Redis me nahi mila.")
    exit()


print("✅ Data successfully retrieved from Redis.\n")


# ---------------------------------------------------------
# STEP 3: Complete Redis data print karo
# ---------------------------------------------------------

print("Redis Key:")
print(f"train:{train_number}:live")


print("\nRedis Data:\n")

for key, value in redis_data.items():

    print(f"{key}: {value}")