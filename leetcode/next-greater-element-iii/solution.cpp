// 下一个更大元素 III（原文档小节：输出下一个更大的数字）
// https://leetcode.cn/problems/next-greater-element-iii/
//
// 思路：把数字看成字符串求「下一个排列」——找最右升序对、与后缀中最小的更大者交换、反转后缀。
// 复杂度：时间 O(L) 空间 O(L)，L 为数字位数（最多 10）
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <utility>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string n;
    if (!(cin >> n)) return 0;

    int len = static_cast<int>(n.size());

    // 1. 从右往左找第一个升序对 a[pivot] < a[pivot + 1]
    int pivot = -1;
    for (int i = len - 1; i > 0; --i) {
        if (n[i - 1] < n[i]) {
            pivot = i - 1;
            break;
        }
    }
    if (pivot == -1) {
        cout << -1 << '\n';  // 已经是最大的排列
        return 0;
    }

    // 2. 后缀非递增，从右往左找第一个大于 n[pivot] 的数字（后缀里最小的更大者）
    int j = len - 1;
    while (n[j] <= n[pivot]) --j;
    swap(n[pivot], n[j]);

    // 3. 后缀反转成非递减，保证整体最小
    reverse(n.begin() + pivot + 1, n.end());

    long long res = stoll(n);
    if (res > INT_MAX) cout << -1 << '\n';
    else cout << res << '\n';
    return 0;
}
