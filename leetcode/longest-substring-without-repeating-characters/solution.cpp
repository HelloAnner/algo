// 最长不含重复字符的子字符串（剑指 Offer 48 / LeetCode 3）
// https://leetcode.cn/problems/longest-substring-without-repeating-characters/
//
// 思路：滑动窗口，last[c] 记录字符 c 上次出现的位置，
//       遇到窗口内重复字符时把左边界一步跳到 last[c] + 1。
// 复杂度：时间 O(n) 空间 O(1)（128 个 ASCII 字符的位置数组）
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s;
    getline(cin, s);

    vector<int> last(128, -1);
    int left = 0, best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        unsigned char c = static_cast<unsigned char>(s[right]);
        if (last[c] >= left) left = last[c] + 1;
        last[c] = right;
        best = max(best, right - left + 1);
    }

    cout << best << '\n';
    return 0;
}
