// 三数之和（LeetCode 15）
// https://leetcode.cn/problems/3sum/
//
// 思路：排序后枚举第一个数，剩余区间用左右双指针夹逼，三处都要跳过重复值。
// 复杂度：时间 O(n^2) 空间 O(1)（不含答案）
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    sort(a.begin(), a.end());

    vector<vector<int>> res;
    for (int k = 0; k + 2 < n; ++k) {
        if (a[k] > 0) break;                      // 最小的数都大于 0，凑不出 0
        if (k > 0 && a[k] == a[k - 1]) continue;  // 第一个数去重
        int i = k + 1, j = n - 1;
        while (i < j) {
            int sum = a[k] + a[i] + a[j];
            if (sum < 0) {
                ++i;
            } else if (sum > 0) {
                --j;
            } else {
                res.push_back({a[k], a[i], a[j]});
                while (i < j && a[i] == a[i + 1]) ++i;  // 第二个数去重
                while (i < j && a[j] == a[j - 1]) --j;  // 第三个数去重
                ++i;
                --j;
            }
        }
    }

    if (res.empty()) {
        cout << '\n';  // 没有答案也要占一行
    } else {
        for (const auto &t : res) {
            cout << t[0] << ' ' << t[1] << ' ' << t[2] << '\n';
        }
    }
    return 0;
}
