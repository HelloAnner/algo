// 剪绳子（剑指 Offer 14- I）
// https://leetcode.cn/problems/jian-sheng-zi-lcof/
//
// 思路：dp[i] 为长度 i 至少剪一刀的最大乘积，枚举第一刀长度 j 做转移。
// 复杂度：时间 O(n^2) 空间 O(n)
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    if (n <= 3) {
        // 2 -> 1 + 1 = 1, 3 -> 1 + 2 = 2
        cout << n - 1 << '\n';
        return 0;
    }

    vector<long long> dp(n + 1, 0);
    dp[1] = 1;
    dp[2] = 1;
    dp[3] = 2;
    for (int i = 4; i <= n; ++i) {
        for (int j = 1; j < i; ++j) {
            long long cut = (long long)j * (i - j);      // 剩下的不剪
            long long keep = (long long)j * dp[i - j];   // 剩下的继续剪
            dp[i] = max(dp[i], max(cut, keep));
        }
    }

    cout << dp[n] << '\n';
    return 0;
}
