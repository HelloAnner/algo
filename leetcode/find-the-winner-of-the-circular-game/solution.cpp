// 找出游戏的获胜者 / 约瑟夫环（LeetCode 1823，同剑指 Offer 62）
// https://leetcode.cn/problems/find-the-winner-of-the-circular-game/
//
// 思路：倒推。只剩 1 人时获胜者下标为 0；把人数从 2 推到 n，
//       每轮 ans = (ans + m) % i，最后换算成 1~n 的编号。
// 复杂度：时间 O(n) 空间 O(1)
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long n, m;
    if (!(cin >> n >> m)) return 0;

    long long ans = 0;  // 0 起始编号下的获胜者下标
    for (long long i = 2; i <= n; ++i) {
        ans = (ans + m) % i;
    }

    cout << ans + 1 << '\n';  // 本题编号是 1~n
    return 0;
}
