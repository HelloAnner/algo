// 第 N 位数字（LeetCode 400. Nth Digit）
// https://leetcode.cn/problems/nth-digit/
//
// 思路：按位数分组（1 位数 9 个、2 位数 90 个 ...），先把前面各组占的位数减掉，
//       再在组内定位到具体数字，并从左数取出第 k 位。
// 复杂度：时间 O(log n) 空间 O(1)
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long n;
    if (!(cin >> n)) return 0;

    long long d = 1;      // 当前组的位数：1, 2, 3 ...
    long long start = 1;  // 当前组的第一个数：1, 10, 100 ...
    long long count = 9;  // 当前组数字的个数：9, 90, 900 ...
    while (n > d * count) {
        n -= d * count;
        ++d;
        start *= 10;
        count *= 10;
    }

    long long num = start + (n - 1) / d;  // 第 n 位所在的数字
    int idx = static_cast<int>((n - 1) % d);  // 在该数字中从左数第几位（0-based）

    // 取出 num 从左数第 idx 位：先砍掉右边的 d - 1 - idx 位
    long long p = 1;
    for (int i = 0; i < d - 1 - idx; ++i) p *= 10;

    cout << (num / p) % 10 << '\n';
    return 0;
}
