// 全排列（LeetCode 46. Permutations）
// https://leetcode.cn/problems/permutations/
//
// 思路：先把数组排序，再按字典序做回溯：每层选一个没用过的数，选满 n 个输出一个排列。
//       因为每层都按升序尝试，输出顺序天然就是字典序。
// 复杂度：时间 O(n * n!) 空间 O(n)
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

static int n;
static vector<int> nums;
static vector<int> path;
static vector<bool> used;

static void dfs() {
    if (static_cast<int>(path.size()) == n) {
        for (int i = 0; i < n; ++i) {
            if (i > 0) cout << ' ';
            cout << path[i];
        }
        cout << '\n';
        return;
    }
    for (int i = 0; i < n; ++i) {
        if (used[i]) continue;
        used[i] = true;
        path.push_back(nums[i]);
        dfs();
        path.pop_back();
        used[i] = false;
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n)) return 0;
    nums.resize(n);
    for (auto &x : nums) cin >> x;

    sort(nums.begin(), nums.end());  // 保证输出是字典序，判题结果才唯一
    used.assign(n, false);
    dfs();

    return 0;
}
