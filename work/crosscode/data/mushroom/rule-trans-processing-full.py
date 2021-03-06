import json
from string import ascii_uppercase
import itertools
import pdb
 
def strSeq():
    for n in itertools.count(1):    
        for s in itertools.product(ascii_uppercase, repeat=n):
            yield "".join(s)


def processRule(cls1InFile, cls2InFile, cls1RuleOutFile, cls2RuleOutFile, obsFile, outObsFile, outRuleFile, attrVals, ruleStats):            
    with open(cls1InFile) as infcls1, \
         open(cls2InFile) as infcls2, \
         open(cls1RuleOutFile, 'w') as outcls1f, \
         open(outRuleFile, 'w') as outRulesf, \
         open(cls2RuleOutFile, 'w') as outcls2f:

        infcls1.seek(0)
        infcls2.seek(0)

        allFreqItem = set()

        childrenFreqItem = {}
  
        cls1Rule = []
        rid = -1
        for r in infcls1:
            rid = rid + 1
            lhs = r.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')
            measures = lhsList[1][:-1].split(',')

            it = []
            for i in itemsets:
                if "=" in i:
                    oneItem = i.split("=")    
                    attrName = oneItem[0]                
                    attrVal = oneItem[1]

                    allFreqItem.add(i.replace('\n', ''))
                    
                    if attrName in childrenFreqItem:
                        secondChildrenObj = childrenFreqItem[attrName]['children'];
                        if attrVal in secondChildrenObj:
                            countRuleObj = secondChildrenObj[attrVal]
                            if 'cls' in countRuleObj:
                                countRuleObj['cls1'].append(rid)
                            else:
                                countRuleObj['cls1'] = [rid]
                        else:
                            secondChildrenObj[attrVal] = {'cls1': [rid], 'cls2': []}                        
                    else:                        
                        childrenFreqItem[attrName] = {'children': {attrVal: {'cls1': [rid], 'cls2': []}}}
                    
                    it.append(i)
            cls1Rule.append({"id": rid, "cls": "cls1", "it":it, "m":[[round(float(measures[0].split("/")[0]), 4), int(measures[0].split("/")[1])], round(float(measures[1]), 4), float(measures[2])]})


        cls2Rule = []
        rid = -1
        for r in infcls2:
            rid = rid + 1
            lhs = r.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')
            measures = lhsList[1][:-1].split(',')

            it = []
            for i in itemsets:
                if "=" in i:
                    oneItem = i.split("=")    
                    attrName = oneItem[0]                
                    attrVal = oneItem[1]

                    allFreqItem.add(i)

                    if attrName in childrenFreqItem:
                        secondChildrenObj = childrenFreqItem[attrName]['children'];
                        if attrVal in secondChildrenObj:
                            countRuleObj = secondChildrenObj[attrVal]
                            if 'cls2' in countRuleObj:
                                countRuleObj['cls2'].append(rid)
                            else:
                                countRuleObj['cls2'] = [rid]
                        else:
                            secondChildrenObj[attrVal] = {'cls1': [], 'cls2': [rid]}                        
                    else:
                        childrenFreqItem[attrName] = {'children': {attrVal: {'cls1': [], 'cls2': [rid]}}}
                    
                    it.append(i)
            cls2Rule.append({"id": rid, "cls": "cls2", "it":it, "m":[[round(float(measures[0].split("/")[0]), 4), int(measures[0].split("/")[1])], round(float(measures[1]), 4), float(measures[2])]})

        json.dump(cls1Rule, outcls1f)
        json.dump(cls2Rule, outcls2f)

        
        outRulesf.write('var ruleStats ='+json.dumps(ruleStats) + ";\n")
        outRulesf.write('var cls1Rule ='+json.dumps(cls1Rule) + ";\n")
        outRulesf.write('var cls2Rule ='+json.dumps(cls2Rule) + ";")
        outRulesf.close()

        #print(childrenFreqItem)

               
        summerizeObs(obsFile, outObsFile, cls1Rule, cls2Rule, attrVals, list(allFreqItem), childrenFreqItem)


def summerizeObs(transFile, outF, cls1Rule, cls2Rule, attrVals, allFreqItem, childrenFreqItem):
    with open(transFile) as obsf, \
         open(outF, 'w') as outf:

 

        print( allFreqItem)
        outList = []
        rawList = []
        idx = 0
        for o in obsf:                           
            d={}   
            rawD = {}
            
            obs_lists = o.split(',')
            obs_list = obs_lists[1:]
            lab = obs_lists[0]

            obs_lists_good = []
            for i in obs_list:
                ori_attr_val = i.split('=')
                oriAttrName = ori_attr_val[0].replace('\n', '')
                oriAttrVal = ori_attr_val[1].replace('\n', '')
                obs_lists_good.append(oriAttrName + "=" + oriAttrVal)
                rawD[oriAttrName] = oriAttrVal

                

                if oriAttrName in childrenFreqItem:
                        secondChildrenObj = childrenFreqItem[oriAttrName]['children'];
                        # {'s': {'cls2': [], 'cls1': [23]}, 'k': {'cls2': [14, 15, 18, 19], 'cls1': []}}
                        if oriAttrVal not in secondChildrenObj:
                            if 'others' in secondChildrenObj:
                                othersObj = secondChildrenObj['others']['children']
                                if oriAttrVal not in othersObj:
                                    othersObj[oriAttrVal] = 1
                                                            
                                
                            else:
                                secondChildrenObj['others'] = {'children': {oriAttrVal: 1}}                  
                                                
                
    
                
            if "e" in lab:
                d["lab"] = 1
                rawD['cls'] = 'e'
                
            else:
                d["lab"] = 2
                rawD['cls'] = 'p'
                
            
            
            d["freqItem"] = list(set(obs_lists_good).intersection(allFreqItem))
            cls1ruleidset = set()
            cls2ruleidset = set()
            obs_set = set(obs_lists_good)
            for r in cls1Rule:
                if set(r['it']).issubset(obs_set):
                    cls1ruleidset.add(r['id'])

            for r in cls2Rule:
                if set(r['it']).issubset(obs_set):
                    cls2ruleidset.add(r['id'])
                
            d['ruleid'] = {'cls1': list(cls1ruleidset), 'cls2': list(cls2ruleidset)}
            d['idx'] = idx
            d['d'] = rawD
            idx = idx + 1
            outList.append(d)
            #rawList.append(rawD)


        freqItemTree = {"name": "Features", "id": "root", "type": "root"}
        childrenFreqItemList = []
        for a in childrenFreqItem:
            secondChi = childrenFreqItem[a]['children']
            secondChiList = []
            # {'s': {'cls2': [], 'cls1': [23]}, 'k': {'cls2': [14, 15, 18, 19], 'cls1': []}}
            for v in secondChi:
                if v != 'others':
                    secondChiList.append({'name': v, 'rules': secondChi[v], "type": 'val', 'rank':len(secondChi[v]['cls2']) + len(secondChi[v]['cls1'])})
                else:
                    othersObj = secondChi[v]['children']                    
                    thirdChiList = []
                    for o in othersObj:
                        thirdChiList.append({'name': o, "type": 'other', 'rank':-1})
                    secondChiList.append({'name': 'others', "type": 'others', 'children': thirdChiList, 'rank': 0})
                        

            childrenFreqItemList.append({'name': a, "type": 'attr', "children": secondChiList})

        freqItemTree['children'] = childrenFreqItemList

        
        #outf.write('var rawObs ='+json.dumps(rawList) + ";\n")
        outf.write('var allObs ='+json.dumps(outList) + ";\n")
        outf.write('var allFreqItem ='+json.dumps(freqItemTree) + ";\n")
        outf.close()



        

def output(cls1InFile, cls2InFile, outStatFile, outCls1File, outCls2File, obsFile, outObsFile, outRuleFile):
    outDict = {}
    outDict["name"] = "Mushroom"
    outDict["dimensions"] = 22
    outDict["instances"] = 8124
    outDict["source"] = "https://archive.ics.uci.edu/ml/datasets/Mushroom"

    
    
    with open(cls1InFile) as infcls1, \
         open(cls2InFile) as infcls2, \
         open(obsFile) as obsfile, \
         open(outStatFile, 'w') as outf:


        attrs = {}
        data = {}

        maxLen = 0

        for o in obsfile:
            itemsets = o.split(',')[1:]
            for i in itemsets:
                if "=" in i:
                    oneItem = i.split("=")    
                    attrName = oneItem[0]                
                    attrVal = oneItem[1].replace('\n', '')
                    
                    if attrName in attrs:
                        attrs[attrName].add(attrVal)
                    else:
                        attrs[attrName] = set([attrVal])
            


        for line in infcls1:            
            lhs = line.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')

            maxLen = max(maxLen, len(itemsets))
           
            
        for line in infcls2:
            lhs = line.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')

            maxLen = max(maxLen, len(itemsets))
          

            

        for a in attrs:
            attrs[a] = list(attrs[a])
    
  
        outDict["attributes"] = attrs
        #outDict["attrMap"] = dict(zip(attrs.keys(), list(itertools.islice(strSeq(),len(attrs)))))
        
        # print(outDict)

        

        ''' aggregate length info'''
        infcls1.seek(0)
        infcls2.seek(0)
        
        for l in range(1, maxLen + 1):
            data["len" + str(l)] = {}
            
        outDict["data"] = data
        #print(outDict)
        
        ruleID = -1
        for line in infcls1:
            ruleID = ruleID + 1
            
            lhs = line.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')
            #measures = lhsList[1][:-1].split(',')

            curLen = data["len" + str(len(itemsets))] 

            for i in itemsets:
                if "=" in i:
                    oneItem = i.split("=")    
                    attrName = oneItem[0]                
                    attrVal = oneItem[1]
                    
                    if attrName in curLen:
                        attrVals = curLen[attrName]
                        if attrName + "=" + attrVal in attrVals:
                            specificNameVal = attrVals[attrName + "=" + attrVal]
                            if "cls1" in specificNameVal:
                                specificNameVal["cls1"].append(ruleID)
                            else:
                                specificNameVal["cls1"] = [ruleID]
                        else:
                            attrVals[attrName + "=" + attrVal] = {"cls1":[ruleID]}
                    else:
                        tmp ={}
                        tmp[attrName + "=" + attrVal] = {"cls1":[ruleID]}
                        curLen[attrName] = tmp


        ruleID = -1             
        for line in infcls2:
            ruleID = ruleID + 1
            lhs = line.split('<-')[1]
            lhsList = lhs.strip().split('(')
            itemsets = lhsList[0].split(',')
            #measures = lhsList[1][:-1].split(',')

            curLen = data["len" + str(len(itemsets))] 

            for i in itemsets:
                if "=" in i:
                    oneItem = i.split("=")    
                    attrName = oneItem[0]                
                    attrVal = oneItem[1]
                    
                    if attrName in curLen:
                        attrVals = curLen[attrName]
                        if attrName + "=" + attrVal in attrVals:
                            specificNameVal = attrVals[attrName + "=" + attrVal]
                            if "cls2" in specificNameVal:
                                specificNameVal["cls2"].append(ruleID)
                            else:
                                specificNameVal["cls2"] = [ruleID]
                        else:
                            attrVals[attrName + "=" + attrVal] = {"cls2":[ruleID]}
                    else:
                        tmp ={}
                        tmp[attrName + "=" + attrVal] = {"cls2":[ruleID]}
                        curLen[attrName] = tmp
            
       
        json.dump(outDict, outf) # rule states

  
    processRule(cls1InFile, cls2InFile, outCls1File, outCls2File, obsFile, outObsFile, outRuleFile, outDict["attributes"],outDict)
   
    
    

if __name__ == "__main__":

    obsFile = "mushroom.dat"
    outObsFile = "obs_mushroom.js"
    outRuleFile = "rules_mushroom.js"
    class1RuleInputFile = "rules_edible_917_prune.txt"
    class2RuleInputFile = "rules_poisonous_917_prune.txt"
    outStatFile = "ruleStats.json"
    outClass1CompressedFile = "edible.json"
    outClass2CompressedFile = "poisonous.json"
  
    
    output(class1RuleInputFile, class2RuleInputFile, outStatFile, outClass1CompressedFile, outClass2CompressedFile, obsFile, outObsFile, outRuleFile)
    

    
    



