// 柠檬水找零（LeetCode 860. Lemonade Change）
// https://leetcode.cn/problems/lemonade-change/
//
// 思路：贪心。只记 5 元和 10 元的张数：收 10 元找 1 张 5 元；
//       收 20 元优先找 10 + 5，不够再找 3 张 5 元。找不开就失败。
// 复杂度：时间 O(n) 空间 O(1)
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    int five = 0;  // 手里的 5 元张数
    int ten = 0;   // 手里的 10 元张数（20 元永远不用找出去，不必统计）
    for (int i = 0; i < n; ++i) {
        int bill;
        cin >> bill;
        if (bill == 5) {
            ++five;
        } else if (bill == 10) {
            ++ten;
            --five;  // 找出一张 5 元
            if (five < 0) {
                cout << "false" << '\n';
                return 0;
            }
        } else {  // 20 元，需要找 15 元
            if (ten > 0) {
                --ten;
                --five;
            } else {
                five -= 3;
            }
            if (five < 0) {
                cout << "false" << '\n';
                return 0;
            }
        }
    }

    cout << "true" << '\n';
    return 0;
}
