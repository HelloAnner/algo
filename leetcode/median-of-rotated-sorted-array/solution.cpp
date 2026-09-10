// 旋转有序数组求中位数（字节跳动面试题：有序数组截断后求中位数）
// 出处：/tmp/byte-dance.md 第 78 题（无 LeetCode 链接）
//
// 思路：二分找到最小元素的下标 rot（即旋转偏移量），
//       排序后第 k 小的元素就是 nums[(rot + k) % n]，取中间的一个或两个即可。
// 复杂度：时间 O(n) 读入 + O(log n) 定位 空间 O(1)（不含输入数组）
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n) || n <= 0) return 0;

    vector<long long> a(n);
    for (auto &x : a) cin >> x;

    // 二分旋转偏移量 rot：最小元素所在的下标
    int lo = 0, hi = n - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    const int rot = lo;

    // 排序后第 k 小（0 开始）的元素在原数组中的位置
    auto kth = [&](int k) -> long long { return a[(rot + k) % n]; };

    if (n % 2 == 1) {
        cout << kth(n / 2) << '\n';
    } else {
        long long sum = kth(n / 2 - 1) + kth(n / 2);
        if (sum % 2 == 0) {
            cout << sum / 2 << '\n';
        } else {
            // 向零取整的 sum / 2 再补一位小数，正负都正确
            cout << sum / 2 << '.' << 5 << '\n';
        }
    }
    return 0;
}
