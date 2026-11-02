"""
seed_dsa.py — Seed DSA sheets and representative problems into Supabase.

Usage:
    python seed_dsa.py

Requires .env with SUPABASE_URL and SUPABASE_SERVICE_KEY.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ---------------------------------------------------------------------------
# Sheet definitions
# ---------------------------------------------------------------------------
SHEETS = [
    {"name": "Striver A2Z", "total_problems": 455},
]

# ---------------------------------------------------------------------------
# Striver A2Z problems — ~80 representative problems across 9 topics
# Difficulty spread: ~30% Easy, ~50% Medium, ~20% Hard
# ---------------------------------------------------------------------------
STRIVER_PROBLEMS = [
    # -----------------------------------------------------------------------
    # Arrays (10)
    # -----------------------------------------------------------------------
    {
        "title": "Two Sum",
        "topic": "Arrays",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/two-sum/",
        "order_index": 1,
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "topic": "Arrays",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        "order_index": 2,
    },
    {
        "title": "Maximum Subarray",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/maximum-subarray/",
        "order_index": 3,
    },
    {
        "title": "Product of Array Except Self",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/product-of-array-except-self/",
        "order_index": 4,
    },
    {
        "title": "Maximum Product Subarray",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/maximum-product-subarray/",
        "order_index": 5,
    },
    {
        "title": "Find Minimum in Rotated Sorted Array",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
        "order_index": 6,
    },
    {
        "title": "Search in Rotated Sorted Array",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        "order_index": 7,
    },
    {
        "title": "3Sum",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/3sum/",
        "order_index": 8,
    },
    {
        "title": "Container With Most Water",
        "topic": "Arrays",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/container-with-most-water/",
        "order_index": 9,
    },
    {
        "title": "Trapping Rain Water",
        "topic": "Arrays",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/trapping-rain-water/",
        "order_index": 10,
    },

    # -----------------------------------------------------------------------
    # Strings (8)
    # -----------------------------------------------------------------------
    {
        "title": "Valid Anagram",
        "topic": "Strings",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/valid-anagram/",
        "order_index": 11,
    },
    {
        "title": "Valid Palindrome",
        "topic": "Strings",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/valid-palindrome/",
        "order_index": 12,
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "topic": "Strings",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        "order_index": 13,
    },
    {
        "title": "Longest Repeating Character Replacement",
        "topic": "Strings",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/longest-repeating-character-replacement/",
        "order_index": 14,
    },
    {
        "title": "Minimum Window Substring",
        "topic": "Strings",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/minimum-window-substring/",
        "order_index": 15,
    },
    {
        "title": "Group Anagrams",
        "topic": "Strings",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/group-anagrams/",
        "order_index": 16,
    },
    {
        "title": "Valid Parentheses",
        "topic": "Strings",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/valid-parentheses/",
        "order_index": 17,
    },
    {
        "title": "Palindromic Substrings",
        "topic": "Strings",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/palindromic-substrings/",
        "order_index": 18,
    },

    # -----------------------------------------------------------------------
    # Linked List (8)
    # -----------------------------------------------------------------------
    {
        "title": "Reverse Linked List",
        "topic": "Linked List",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/reverse-linked-list/",
        "order_index": 19,
    },
    {
        "title": "Merge Two Sorted Lists",
        "topic": "Linked List",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/merge-two-sorted-lists/",
        "order_index": 20,
    },
    {
        "title": "Linked List Cycle",
        "topic": "Linked List",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/linked-list-cycle/",
        "order_index": 21,
    },
    {
        "title": "Reorder List",
        "topic": "Linked List",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/reorder-list/",
        "order_index": 22,
    },
    {
        "title": "Remove Nth Node From End of List",
        "topic": "Linked List",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
        "order_index": 23,
    },
    {
        "title": "Copy List with Random Pointer",
        "topic": "Linked List",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/copy-list-with-random-pointer/",
        "order_index": 24,
    },
    {
        "title": "Add Two Numbers",
        "topic": "Linked List",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/add-two-numbers/",
        "order_index": 25,
    },
    {
        "title": "Find the Duplicate Number",
        "topic": "Linked List",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/find-the-duplicate-number/",
        "order_index": 26,
    },

    # -----------------------------------------------------------------------
    # Binary Search (8)
    # -----------------------------------------------------------------------
    {
        "title": "Binary Search",
        "topic": "Binary Search",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/binary-search/",
        "order_index": 27,
    },
    {
        "title": "Search a 2D Matrix",
        "topic": "Binary Search",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/search-a-2d-matrix/",
        "order_index": 28,
    },
    {
        "title": "Koko Eating Bananas",
        "topic": "Binary Search",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/koko-eating-bananas/",
        "order_index": 29,
    },
    {
        "title": "Find Minimum in Rotated Sorted Array II",
        "topic": "Binary Search",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array-ii/",
        "order_index": 30,
    },
    {
        "title": "Search in Rotated Sorted Array II",
        "topic": "Binary Search",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/",
        "order_index": 31,
    },
    {
        "title": "Time Based Key-Value Store",
        "topic": "Binary Search",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/time-based-key-value-store/",
        "order_index": 32,
    },
    {
        "title": "Median of Two Sorted Arrays",
        "topic": "Binary Search",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
        "order_index": 33,
    },
    {
        "title": "Aggressive Cows",
        "topic": "Binary Search",
        "difficulty": "Medium",
        "lc_link": "https://www.spoj.com/problems/AGGRCOW/",
        "order_index": 34,
    },

    # -----------------------------------------------------------------------
    # Stacks & Queues (8)
    # -----------------------------------------------------------------------
    {
        "title": "Valid Parentheses",
        "topic": "Stacks & Queues",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/valid-parentheses/",
        "order_index": 35,
    },
    {
        "title": "Min Stack",
        "topic": "Stacks & Queues",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/min-stack/",
        "order_index": 36,
    },
    {
        "title": "Evaluate Reverse Polish Notation",
        "topic": "Stacks & Queues",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
        "order_index": 37,
    },
    {
        "title": "Generate Parentheses",
        "topic": "Stacks & Queues",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/generate-parentheses/",
        "order_index": 38,
    },
    {
        "title": "Daily Temperatures",
        "topic": "Stacks & Queues",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/daily-temperatures/",
        "order_index": 39,
    },
    {
        "title": "Car Fleet",
        "topic": "Stacks & Queues",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/car-fleet/",
        "order_index": 40,
    },
    {
        "title": "Largest Rectangle in Histogram",
        "topic": "Stacks & Queues",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
        "order_index": 41,
    },
    {
        "title": "Sliding Window Maximum",
        "topic": "Stacks & Queues",
        "difficulty": "Hard",
        "lc_link": "https://leetcode.com/problems/sliding-window-maximum/",
        "order_index": 42,
    },

    # -----------------------------------------------------------------------
    # Trees (10)
    # -----------------------------------------------------------------------
    {
        "title": "Invert Binary Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/invert-binary-tree/",
        "order_index": 43,
    },
    {
        "title": "Maximum Depth of Binary Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        "order_index": 44,
    },
    {
        "title": "Diameter of Binary Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/diameter-of-binary-tree/",
        "order_index": 45,
    },
    {
        "title": "Balanced Binary Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/balanced-binary-tree/",
        "order_index": 46,
    },
    {
        "title": "Same Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/same-tree/",
        "order_index": 47,
    },
    {
        "title": "Subtree of Another Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/subtree-of-another-tree/",
        "order_index": 48,
    },
    {
        "title": "Lowest Common Ancestor of a Binary Search Tree",
        "topic": "Trees",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
        "order_index": 49,
    },
    {
        "title": "Binary Tree Level Order Traversal",
        "topic": "Trees",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        "order_index": 50,
    },
    {
        "title": "Binary Tree Right Side View",
        "topic": "Trees",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/binary-tree-right-side-view/",
        "order_index": 51,
    },
    {
        "title": "Count Good Nodes in Binary Tree",
        "topic": "Trees",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/count-good-nodes-in-binary-tree/",
        "order_index": 52,
    },

    # -----------------------------------------------------------------------
    # Graphs (10)
    # -----------------------------------------------------------------------
    {
        "title": "Number of Islands",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/number-of-islands/",
        "order_index": 53,
    },
    {
        "title": "Clone Graph",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/clone-graph/",
        "order_index": 54,
    },
    {
        "title": "Max Area of Island",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/max-area-of-island/",
        "order_index": 55,
    },
    {
        "title": "Pacific Atlantic Water Flow",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
        "order_index": 56,
    },
    {
        "title": "Surrounded Regions",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/surrounded-regions/",
        "order_index": 57,
    },
    {
        "title": "Rotting Oranges",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/rotting-oranges/",
        "order_index": 58,
    },
    {
        "title": "Walls and Gates",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/walls-and-gates/",
        "order_index": 59,
    },
    {
        "title": "Course Schedule",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/course-schedule/",
        "order_index": 60,
    },
    {
        "title": "Course Schedule II",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/course-schedule-ii/",
        "order_index": 61,
    },
    {
        "title": "Redundant Connection",
        "topic": "Graphs",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/redundant-connection/",
        "order_index": 62,
    },

    # -----------------------------------------------------------------------
    # Dynamic Programming (10)
    # -----------------------------------------------------------------------
    {
        "title": "Climbing Stairs",
        "topic": "Dynamic Programming",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/climbing-stairs/",
        "order_index": 63,
    },
    {
        "title": "Min Cost Climbing Stairs",
        "topic": "Dynamic Programming",
        "difficulty": "Easy",
        "lc_link": "https://leetcode.com/problems/min-cost-climbing-stairs/",
        "order_index": 64,
    },
    {
        "title": "House Robber",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/house-robber/",
        "order_index": 65,
    },
    {
        "title": "House Robber II",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/house-robber-ii/",
        "order_index": 66,
    },
    {
        "title": "Longest Palindromic Substring",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/longest-palindromic-substring/",
        "order_index": 67,
    },
    {
        "title": "Palindromic Substrings",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/palindromic-substrings/",
        "order_index": 68,
    },
    {
        "title": "Decode Ways",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/decode-ways/",
        "order_index": 69,
    },
    {
        "title": "Coin Change",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/coin-change/",
        "order_index": 70,
    },
    {
        "title": "Maximum Product Subarray",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/maximum-product-subarray/",
        "order_index": 71,
    },
    {
        "title": "Word Break",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/word-break/",
        "order_index": 72,
    },

    # -----------------------------------------------------------------------
    # Recursion & Backtracking (8)
    # -----------------------------------------------------------------------
    {
        "title": "Subsets",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/subsets/",
        "order_index": 73,
    },
    {
        "title": "Combination Sum",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/combination-sum/",
        "order_index": 74,
    },
    {
        "title": "Permutations",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/permutations/",
        "order_index": 75,
    },
    {
        "title": "Subsets II",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/subsets-ii/",
        "order_index": 76,
    },
    {
        "title": "Combination Sum II",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/combination-sum-ii/",
        "order_index": 77,
    },
    {
        "title": "Word Search",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/word-search/",
        "order_index": 78,
    },
    {
        "title": "Palindrome Partitioning",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/palindrome-partitioning/",
        "order_index": 79,
    },
    {
        "title": "Letter Combinations of a Phone Number",
        "topic": "Recursion & Backtracking",
        "difficulty": "Medium",
        "lc_link": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
        "order_index": 80,
    },
]

# Map sheet name → list of problems to seed
PROBLEMS_BY_SHEET = {
    "Striver A2Z": STRIVER_PROBLEMS,
}


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

def get_or_create_sheet(sheet_def: dict) -> str:
    """Return existing sheet ID or insert and return new ID."""
    existing = supabase.table("dsa_sheets") \
        .select("id, name") \
        .eq("name", sheet_def["name"]) \
        .execute().data

    if existing:
        print(f"  Sheet '{sheet_def['name']}' already exists (id={existing[0]['id']}), skipping creation.")
        return existing[0]["id"]

    result = supabase.table("dsa_sheets").insert({
        "name": sheet_def["name"],
        "total_problems": sheet_def["total_problems"],
    }).execute()

    sheet_id = result.data[0]["id"]
    print(f"  Created sheet '{sheet_def['name']}' (id={sheet_id}).")
    return sheet_id


def seed_problems(sheet_id: str, sheet_name: str, problems: list) -> None:
    """Insert problems for a sheet if not already present, or patch lc_link on existing rows."""
    if not problems:
        print(f"  No problems defined for '{sheet_name}', skipping.")
        return

    # Check existing problems
    existing_result = supabase.table("dsa_problems") \
        .select("id, title, lc_link, order_index") \
        .eq("sheet_id", sheet_id) \
        .execute()

    existing_rows = existing_result.data or []
    existing_count = len(existing_rows)

    if existing_count > 0:
        print(f"  '{sheet_name}' already has {existing_count} problems — patching lc_link on any nulls...")
        # Build lookup by order_index to match seed data
        existing_by_order = {r["order_index"]: r for r in existing_rows}
        patched = 0
        for prob in problems:
            row = existing_by_order.get(prob["order_index"])
            if row and not row.get("lc_link") and prob.get("lc_link"):
                supabase.table("dsa_problems").update({
                    "lc_link": prob["lc_link"]
                }).eq("id", row["id"]).execute()
                patched += 1
        print(f"  Patched lc_link on {patched} problems.")
        return

    # Attach sheet_id to every problem
    rows = [{**p, "sheet_id": sheet_id} for p in problems]

    # Insert in batches of 50 to stay well within Supabase limits
    batch_size = 50
    inserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i: i + batch_size]
        supabase.table("dsa_problems").insert(batch).execute()
        inserted += len(batch)

    print(f"  Inserted {inserted} problems into '{sheet_name}'.")


def remove_unused_sheets():
    """Delete Love Babbar 450 and NeetCode 150 if they exist (no problems, not needed)."""
    for name in ["Love Babbar 450", "NeetCode 150"]:
        existing = supabase.table("dsa_sheets").select("id").eq("name", name).execute().data
        if existing:
            sheet_id = existing[0]["id"]
            supabase.table("dsa_problems").delete().eq("sheet_id", sheet_id).execute()
            supabase.table("dsa_sheets").delete().eq("id", sheet_id).execute()
            print(f"  Removed unused sheet: '{name}'")


def main():
    print("=== PathForge DSA Seed Script ===\n")

    # Clean up unused sheets first
    print("Cleaning up unused sheets...")
    remove_unused_sheets()
    print()

    for sheet_def in SHEETS:
        print(f"Seeding sheet: {sheet_def['name']}...")
        sheet_id = get_or_create_sheet(sheet_def)
        problems = PROBLEMS_BY_SHEET.get(sheet_def["name"], [])
        seed_problems(sheet_id, sheet_def["name"], problems)
        print()

    print("Done.")


if __name__ == "__main__":
    main()
