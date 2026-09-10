// 找出不重复的元素个数（山峰数组的不同值计数）
// https://www.nowcoder.com/discuss/425581
//
// 思路：先线性找到峰顶，再从峰顶向两侧双指针归并（两侧都非递增）并去重计数。
// 复杂度：时间 O(n) 空间 O(1)
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

    // 非递减前缀的最后一个下标；相等平台取最右端，保证两侧都是非递增
    int peak = 0;
    while (peak + 1 < n && nums[peak] <= nums[peak + 1]) ++peak;

    const long long NEG = -4000000000000000000LL;  // 比任何输入都小的哨兵
    int i = peak, j = peak + 1;
    long long last = 0;
    bool first = true;
    int count = 0;

    while (i >= 0 || j < n) {
        long long a = (i >= 0 ? nums[i] : NEG);
        long long b = (j < n ? nums[j] : NEG);
        long long cur;
        if (a >= b) {  // 取较大者，保证输出序列非递增
            cur = a;
            --i;
        } else {
            cur = b;
            ++j;
        }
        if (first || cur != last) {  // 与上一个输出比较即可去重
            first = false;
            last = cur;
            ++count;
        }
    }

    cout << count << '\n';
    return 0;
}
