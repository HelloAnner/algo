// 有序数组中不重复元素的个数（平方后不同值的个数）
// https://www.nowcoder.com/discuss/425581
//
// 思路：双指针从两端比较绝对值，按从大到小归并平方值并线性去重。
// 复杂度：时间 O(n) 空间 O(1)
#include <cstdlib>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        cout << 0 << '\n';
        return 0;
    }

    vector<long long> nums(n);
    for (auto &x : nums) cin >> x;

    long long last = -1;  // 平方值非负，用 -1 当哨兵
    int count = 0;
    int l = 0, r = n - 1;
    while (l <= r) {
        long long a = llabs(nums[l]);
        long long b = llabs(nums[r]);
        long long cur;
        if (a > b) {
            cur = a * a;
            ++l;
        } else if (a < b) {
            cur = b * b;
            --r;
        } else {
            cur = a * a;
            ++l;
            --r;
        }
        if (cur != last) {
            ++count;
            last = cur;
        }
    }

    cout << count << '\n';
    return 0;
}
