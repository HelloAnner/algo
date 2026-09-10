// 跳跃游戏
// https://leetcode.cn/problems/jump-game/
//
// 思路：一次遍历贪心维护最远可达下标 reach，i > reach 说明断档，返回 false。
// 复杂度：时间 O(n) 空间 O(1)
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        cout << "false" << '\n';
        return 0;
    }

    vector<int> nums(n);
    for (auto &x : nums) cin >> x;

    int reach = 0;
    for (int i = 0; i < n; ++i) {
        if (i > reach) {
            cout << "false" << '\n';
            return 0;
        }
        reach = max(reach, i + nums[i]);
        if (reach >= n - 1) {
            cout << "true" << '\n';
            return 0;
        }
    }

    cout << "false" << '\n';
    return 0;
}
